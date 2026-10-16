import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CityDefinition, BuildingData, BranchTickMetrics, HazardType } from '../types/simulation';
import {
  getSkyscraperTexture,
  getResidentialTexture,
  getCommercialTexture,
  getHospitalTexture,
  getRoadTexture,
  getHelipadTexture,
  getGrassTexture,
  getSidewalkTexture
} from '../services/textureGenerator';
import {
  Compass,
  AlertTriangle,
  Building,
  Flame,
  Droplets,
  Zap,
  MapPin,
  Eye,
  ShieldCheck,
  Radio,
  Maximize2,
  Minimize2,
  Globe
} from 'lucide-react';
import { MapToolsDrawer } from './MapToolsDrawer';
import { getTerrainElevation } from '../services/cityData';

interface CityScene3DProps {
  city: CityDefinition;
  currentMetrics: BranchTickMetrics;
  hazardType: HazardType;
  branchId: 'A' | 'B' | 'C';
  onSelectBuilding: (building: BuildingData | null) => void;
  selectedBuildingId: string | null;
  onSetSourceOrigin?: (x: number, z: number) => void;
}

export const CityScene3D: React.FC<CityScene3DProps> = ({
  city,
  currentMetrics,
  hazardType,
  branchId,
  onSelectBuilding,
  selectedBuildingId,
  onSetSourceOrigin
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Groups
  const terrainGroupRef = useRef<THREE.Group>(new THREE.Group());
  const roadGroupRef = useRef<THREE.Group>(new THREE.Group());
  const sidewalkGroupRef = useRef<THREE.Group>(new THREE.Group());
  const treeGroupRef = useRef<THREE.Group>(new THREE.Group());
  const streetLightGroupRef = useRef<THREE.Group>(new THREE.Group());
  const buildingMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const beaconLightsRef = useRef<THREE.Mesh[]>([]);
  const assetGroupRef = useRef<THREE.Group>(new THREE.Group());
  const hazardGroupRef = useRef<THREE.Group>(new THREE.Group());
  const vehicleGroupRef = useRef<THREE.Group>(new THREE.Group());
  const debrisGroupRef = useRef<THREE.Group>(new THREE.Group());
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const evacAgentsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const sourceBeaconRef = useRef<THREE.Group>(new THREE.Group());
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const selectedBoxRef = useRef<THREE.BoxHelper | null>(null);

  const [webglError, setWebglError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'oblique' | 'top' | 'ground' | 'hospital' | 'source'>('oblique');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlacingSource, setIsPlacingSource] = useState(false);
  const placingSourceRef = useRef(false);
  useEffect(() => { placingSourceRef.current = isPlacingSource; }, [isPlacingSource]);
  const [tilesMode, setTilesMode] = useState<'synthetic' | 'google_3d'>('synthetic');
  const googleApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [overlays, setOverlays] = useState({
    hazardFootprint: true,
    lifelineHalos: true,
    evacCorridors: true,
    roadBarricades: true
  });

  const animFrameId = useRef<number | null>(null);
  const clockRef = useRef(new THREE.Clock());

  // Fullscreen handlers
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Highlight selected building in 3D
  useEffect(() => {
    if (!sceneRef.current) return;
    if (selectedBoxRef.current) {
      sceneRef.current.remove(selectedBoxRef.current);
      selectedBoxRef.current.dispose();
      selectedBoxRef.current = null;
    }

    if (selectedBuildingId) {
      const mesh = buildingMeshesRef.current.get(selectedBuildingId);
      if (mesh) {
        const box = new THREE.BoxHelper(mesh, 0x06b6d4);
        (box.material as THREE.LineBasicMaterial).linewidth = 3;
        sceneRef.current.add(box);
        selectedBoxRef.current = box;

        if (controlsRef.current) {
          const bld = mesh.userData.building as BuildingData;
          if (bld) {
            const groundY = bld.y ?? getTerrainElevation(bld.x, bld.z, city.terrain_heights);
            controlsRef.current.target.set(bld.x, groundY + bld.height / 2, bld.z);
            controlsRef.current.update();
          }
        }
      }
    }
  }, [selectedBuildingId, city.terrain_heights]);

  // Toggle layer visibility
  useEffect(() => {
    hazardGroupRef.current.visible = overlays.hazardFootprint;
    assetGroupRef.current.children.forEach(grp => {
      const halo = grp.userData.halo as THREE.Mesh;
      if (halo) halo.visible = overlays.lifelineHalos;
    });
    evacAgentsGroupRef.current.visible = overlays.evacCorridors;
  }, [overlays]);

  // Google 3D Tiles vs Synthetic City toggle effect
  useEffect(() => {
    const isGoogle3DWithKey = tilesMode === 'google_3d' && Boolean(googleApiKey);
    buildingMeshesRef.current.forEach(mesh => {
      mesh.visible = !isGoogle3DWithKey;
    });
    terrainGroupRef.current.visible = !isGoogle3DWithKey;
    roadGroupRef.current.visible = !isGoogle3DWithKey;
    sidewalkGroupRef.current.visible = !isGoogle3DWithKey;
    treeGroupRef.current.visible = !isGoogle3DWithKey;
  }, [tilesMode, googleApiKey]);

  // ==========================================
  // PROCEDURAL REALISTIC WORLD GENERATORS
  // ==========================================

  function buildRealisticTerrain(terrainGroup: THREE.Group, cityData: CityDefinition) {
    terrainGroup.clear();

    const size = 80;
    const segments = 64;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainElevation(x, z, cityData.terrain_heights);
      pos.setY(i, y);
    }
    geom.computeVertexNormals();

    const grassTex = getGrassTexture();
    grassTex.repeat.set(16, 16);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: grassTex,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true
    });
    const ground = new THREE.Mesh(geom, groundMat);
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // River / Waterway Mesh along river path
    const riverGeom = new THREE.PlaneGeometry(78, 12, 48, 8);
    riverGeom.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88
    });
    const riverWater = new THREE.Mesh(riverGeom, riverMat);
    riverWater.position.set(0, -0.68, -2);
    waterMeshRef.current = riverWater;
    terrainGroup.add(riverWater);

    // River embankment stone riprap walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    for (let x = -38; x <= 38; x += 3) {
      const zCenter = -2.0 + Math.sin(x / 8.0) * 3.0;
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.45), wallMat);
      w1.position.set(x, -0.2, zCenter - 5.0);
      terrainGroup.add(w1);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 0.45), wallMat);
      w2.position.set(x, -0.2, zCenter + 5.0);
      terrainGroup.add(w2);
    }
  }

  function buildRealisticRoadsAndSidewalks(
    roadGroup: THREE.Group,
    sidewalkGroup: THREE.Group,
    streetLightGroup: THREE.Group,
    cityData: CityDefinition
  ) {
    roadGroup.clear();
    sidewalkGroup.clear();
    streetLightGroup.clear();

    const sidewalkTex = getSidewalkTexture();
    sidewalkTex.repeat.set(6, 1);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.7,
      metalness: 0.1
    });

    const bridgeTrussMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.75
    });

    const pierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
    const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    cityData.roads.forEach(road => {
      const len = Math.hypot(road.x2 - road.x1, road.z2 - road.z1);
      const angle = Math.atan2(road.z2 - road.z1, road.x2 - road.x1);
      const midX = (road.x1 + road.x2) / 2;
      const midZ = (road.z1 + road.z2) / 2;

      const roadTex = getRoadTexture(road.lanes, true);
      const roadTexCloned = roadTex.clone();
      roadTexCloned.repeat.set(len / 8, 1);
      roadTexCloned.needsUpdate = true;

      const roadMat = new THREE.MeshStandardMaterial({
        map: roadTexCloned,
        roughness: 0.6,
        metalness: 0.15
      });

      if (road.is_bridge) {
        // Elevated Bridge Deck
        const deckY = 0.52;
        const bridgeDeck = new THREE.Mesh(
          new THREE.BoxGeometry(len, 0.42, road.width),
          roadMat
        );
        bridgeDeck.position.set(midX, deckY, midZ);
        bridgeDeck.rotation.y = -angle;
        bridgeDeck.receiveShadow = true;
        bridgeDeck.userData = { roadId: road.id, baseColor: 0xffffff };
        roadGroup.add(bridgeDeck);

        // Concrete Bridge Piers
        const numPiers = 4;
        for (let p = 1; p < numPiers; p++) {
          const frac = (p / numPiers) - 0.5;
          const px = midX + Math.cos(angle) * (frac * len);
          const pz = midZ + Math.sin(angle) * (frac * len);

          const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.4, 16), pierMat);
          pier.position.set(px, -0.45, pz);
          roadGroup.add(pier);
        }

        // Bridge Truss Arches
        const archGeom = new THREE.TorusGeometry(3.6, 0.14, 8, 24, Math.PI);
        const arch = new THREE.Mesh(archGeom, bridgeTrussMat);
        arch.position.set(midX, deckY + 0.05, midZ);
        arch.rotation.y = -angle;
        arch.rotation.z = Math.PI;
        roadGroup.add(arch);

        // Bridge Sidewalks
        const swWidth = 0.7;
        const offsetDist = (road.width / 2) + (swWidth / 2);
        const swL = new THREE.Mesh(new THREE.BoxGeometry(len, 0.22, swWidth), sidewalkMat);
        swL.position.set(midX - Math.sin(angle) * offsetDist, deckY + 0.1, midZ - Math.cos(angle) * offsetDist);
        swL.rotation.y = -angle;
        sidewalkGroup.add(swL);

        const swR = new THREE.Mesh(new THREE.BoxGeometry(len, 0.22, swWidth), sidewalkMat);
        swR.position.set(midX + Math.sin(angle) * offsetDist, deckY + 0.1, midZ + Math.cos(angle) * offsetDist);
        swR.rotation.y = -angle;
        sidewalkGroup.add(swR);
      } else {
        // Terrain-Conforming Road Segments
        const steps = Math.max(4, Math.floor(len / 4));
        const swWidth = 0.8;
        const offsetDist = (road.width / 2) + (swWidth / 2);

        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          const sx1 = road.x1 + (road.x2 - road.x1) * t0;
          const sz1 = road.z1 + (road.z2 - road.z1) * t0;
          const sx2 = road.x1 + (road.x2 - road.x1) * t1;
          const sz2 = road.z1 + (road.z2 - road.z1) * t1;

          const subMidX = (sx1 + sx2) / 2;
          const subMidZ = (sz1 + sz2) / 2;
          const subLen = Math.hypot(sx2 - sx1, sz2 - sz1);
          const subY = getTerrainElevation(subMidX, subMidZ, cityData.terrain_heights) + 0.045;

          const subMesh = new THREE.Mesh(
            new THREE.BoxGeometry(subLen + 0.04, 0.08, road.width),
            roadMat
          );
          subMesh.position.set(subMidX, subY, subMidZ);
          subMesh.rotation.y = -angle;
          subMesh.receiveShadow = true;
          subMesh.userData = { roadId: road.id, baseColor: 0xffffff };
          roadGroup.add(subMesh);

          // Flanking Sidewalks
          const swL = new THREE.Mesh(new THREE.BoxGeometry(subLen + 0.04, 0.14, swWidth), sidewalkMat);
          swL.position.set(
            subMidX - Math.sin(angle) * offsetDist,
            subY + 0.04,
            subMidZ - Math.cos(angle) * offsetDist
          );
          swL.rotation.y = -angle;
          swL.receiveShadow = true;
          sidewalkGroup.add(swL);

          const swR = new THREE.Mesh(new THREE.BoxGeometry(subLen + 0.04, 0.14, swWidth), sidewalkMat);
          swR.position.set(
            subMidX + Math.sin(angle) * offsetDist,
            subY + 0.04,
            subMidZ + Math.cos(angle) * offsetDist
          );
          swR.rotation.y = -angle;
          swR.receiveShadow = true;
          sidewalkGroup.add(swR);
        }

        // Streetlamps along road
        const numLamps = Math.floor(len / 12);
        for (let l = 1; l < numLamps; l++) {
          const t = l / numLamps;
          const lx = road.x1 + (road.x2 - road.x1) * t + Math.sin(angle) * (offsetDist + 0.35);
          const lz = road.z1 + (road.z2 - road.z1) * t + Math.cos(angle) * (offsetDist + 0.35);
          const ly = getTerrainElevation(lx, lz, cityData.terrain_heights) + 0.1;

          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), lampPoleMat);
          pole.position.set(lx, ly + 1.2, lz);
          streetLightGroup.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), lampPoleMat);
          arm.position.set(lx, ly + 2.4, lz);
          streetLightGroup.add(arm);

          const lampLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), lampHeadMat);
          lampLight.position.set(lx, ly + 2.37, lz);
          streetLightGroup.add(lampLight);
        }
      }
    });

    // 2. Road Intersections Junction Pads
    const intersectionMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65,
      metalness: 0.1
    });
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const junctionCoords = [-24, -16, -8, 0, 8, 16, 24];
    for (const jx of junctionCoords) {
      for (const jz of junctionCoords) {
        if (cityData.id === 'chennai' && jx > 18) continue;
        if (cityData.id === 'mumbai' && jx < -18) continue;
        if (cityData.id === 'visakhapatnam' && jx > 18) continue;

        const jy = getTerrainElevation(jx, jz, cityData.terrain_heights) + 0.052;
        const jPad = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.085, 4.3), intersectionMat);
        jPad.position.set(jx, jy, jz);
        jPad.receiveShadow = true;
        roadGroup.add(jPad);

        // Zebra Crosswalk Stripes on the 4 approaches
        for (let stripe = -3; stripe <= 3; stripe += 2) {
          const zEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.8), zebraMat);
          zEast.position.set(jx + 2.3, jy + 0.005, jz + stripe * 0.45);
          roadGroup.add(zEast);

          const zWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.8), zebraMat);
          zWest.position.set(jx - 2.3, jy + 0.005, jz + stripe * 0.45);
          roadGroup.add(zWest);

          const zNorth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.3), zebraMat);
          zNorth.position.set(jx + stripe * 0.45, jy + 0.005, jz - 2.3);
          roadGroup.add(zNorth);

          const zSouth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.09, 0.3), zebraMat);
          zSouth.position.set(jx + stripe * 0.45, jy + 0.005, jz + 2.3);
          roadGroup.add(zSouth);
        }
      }
    }
  }

  function buildRealisticBuildings(scene: THREE.Scene, cityData: CityDefinition) {
    buildingMeshesRef.current.clear();
    beaconLightsRef.current = [];

    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 });
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.5 });
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const redCrossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const porticoMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

    cityData.buildings.forEach((bld) => {
      const groundY = getTerrainElevation(bld.x, bld.z, cityData.terrain_heights);

      let texture: THREE.CanvasTexture;
      let roughness = 0.5;
      let metalness = 0.2;

      if (bld.type === 'hospital') {
        texture = getHospitalTexture();
        roughness = 0.25;
        metalness = 0.3;
      } else if (bld.type === 'commercial' || bld.floors >= 8) {
        texture = getSkyscraperTexture();
        roughness = 0.12;
        metalness = 0.75;
      } else {
        texture = getResidentialTexture();
        roughness = 0.65;
        metalness = 0.15;
      }

      const texCloned = texture.clone();
      texCloned.repeat.set(Math.max(1, Math.round(bld.width / 1.6)), Math.max(1, Math.round(bld.height / 1.8)));
      texCloned.needsUpdate = true;

      // 1. Foundation Footing / Basement Plinth (Anchors firmly into terrain on slopes)
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(bld.width + 0.2, 1.2, bld.depth + 0.2),
        plinthMat
      );
      plinth.position.set(bld.x, groundY - 0.45, bld.z);
      plinth.receiveShadow = true;
      scene.add(plinth);

      // 2. Building Superstructure
      const geom = new THREE.BoxGeometry(bld.width, bld.height, bld.depth);
      const mat = new THREE.MeshStandardMaterial({
        map: texCloned,
        roughness,
        metalness,
        flatShading: false
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(bld.x, groundY + bld.height / 2, bld.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        buildingId: bld.id,
        building: bld,
        baseColor: 0xffffff,
        groundY: groundY,
        baseY: groundY + bld.height / 2,
        baseHeight: bld.height,
        foundationPlinth: plinth,
        roofAddons: [] as THREE.Object3D[]
      };

      // 3. Architectural depth: corner pilasters and subtle floor slab reveals.
      // These small, low-poly details catch light and make the procedural blocks read
      // as buildings rather than plain boxes without adding expensive geometry.
      const cornerMat = new THREE.MeshStandardMaterial({
        color: bld.type === 'commercial' || bld.floors >= 8 ? 0x64748b : 0xb8b5ad,
        roughness: 0.78,
        metalness: bld.type === 'commercial' || bld.floors >= 8 ? 0.28 : 0.04
      });
      const cornerWidth = Math.max(0.07, Math.min(0.16, bld.width * 0.035));
      for (const sideX of [-1, 1]) {
        const pilaster = new THREE.Mesh(
          new THREE.BoxGeometry(cornerWidth, bld.height, 0.08),
          cornerMat
        );
        pilaster.position.set(bld.x + sideX * (bld.width / 2 - cornerWidth / 2), groundY + bld.height / 2, bld.z + bld.depth / 2 + 0.035);
        pilaster.castShadow = true;
        scene.add(pilaster);
        mesh.userData.roofAddons.push(pilaster);
      }
      if (bld.floors >= 3 && bld.height >= 3) {
        const visibleFloorCount = Math.min(12, Math.max(2, bld.floors));
        const revealMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, transparent: true, opacity: 0.38 });
        for (let floor = 1; floor < visibleFloorCount; floor++) {
          const reveal = new THREE.Mesh(
            new THREE.BoxGeometry(bld.width + 0.025, 0.035, 0.045),
            revealMat
          );
          reveal.position.set(bld.x, groundY + (bld.height / visibleFloorCount) * floor, bld.z + bld.depth / 2 + 0.04);
          scene.add(reveal);
          mesh.userData.roofAddons.push(reveal);
        }
      }

      // 4. Ground-level Entrance Canopy / Portico
      const portico = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(1.8, bld.width * 0.65), 0.55, 0.35),
        porticoMat
      );
      portico.position.set(bld.x, groundY + 0.3, bld.z + bld.depth / 2 + 0.18);
      scene.add(portico);
      mesh.userData.roofAddons.push(portico);

      // 5. Facade detailing: balcony slabs/rails on apartments and vertical fins on towers.
      const roofY = groundY + bld.height + 0.05;
      const facadeMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.72, roughness: 0.34 });
      const concreteBand = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.82 });
      if (bld.type === 'residential' && bld.floors >= 2 && bld.floors <= 8) {
        const floorHeight = bld.height / Math.max(1, bld.floors);
        const balconyWidth = Math.min(bld.width * 0.72, 2.4);
        for (let floor = 1; floor < bld.floors; floor++) {
          const balconyY = groundY + floor * floorHeight - 0.12;
          const balcony = new THREE.Mesh(new THREE.BoxGeometry(balconyWidth, 0.12, 0.58), concreteBand);
          balcony.position.set(bld.x, balconyY, bld.z + bld.depth / 2 + 0.22);
          balcony.castShadow = true;
          scene.add(balcony);
          mesh.userData.roofAddons.push(balcony);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(balconyWidth, 0.055, 0.055), facadeMetal);
          rail.position.set(bld.x, balconyY + 0.48, bld.z + bld.depth / 2 + 0.48);
          scene.add(rail);
          mesh.userData.roofAddons.push(rail);
          for (const side of [-1, 1]) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.42, 0.045), facadeMetal);
            post.position.set(bld.x + side * balconyWidth * 0.46, balconyY + 0.27, bld.z + bld.depth / 2 + 0.48);
            scene.add(post);
            mesh.userData.roofAddons.push(post);
          }
        }
      } else if ((bld.type === 'commercial' || bld.floors >= 8) && bld.width > 2) {
        for (const side of [-1, 1]) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, bld.height, 0.16), facadeMetal);
          fin.position.set(bld.x + side * (bld.width / 2 + 0.035), groundY + bld.height / 2, bld.z + bld.depth * 0.22);
          scene.add(fin);
          mesh.userData.roofAddons.push(fin);
        }
        const bandCount = Math.min(8, Math.max(2, bld.floors));
        for (let floor = 1; floor < bandCount; floor++) {
          const band = new THREE.Mesh(new THREE.BoxGeometry(bld.width + 0.08, 0.07, bld.depth + 0.08), concreteBand);
          band.position.set(bld.x, groundY + (bld.height / bandCount) * floor, bld.z);
          scene.add(band);
          mesh.userData.roofAddons.push(band);
        }
      }

      if (bld.type === 'hospital') {
        const padGeom = new THREE.PlaneGeometry(bld.width * 0.85, bld.depth * 0.85);
        padGeom.rotateX(-Math.PI / 2);
        const padMat = new THREE.MeshStandardMaterial({ map: getHelipadTexture(), roughness: 0.7 });
        const helipad = new THREE.Mesh(padGeom, padMat);
        helipad.position.set(bld.x, roofY + 0.02, bld.z);
        scene.add(helipad);
        mesh.userData.roofAddons.push(helipad);

        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.15), redCrossMat);
        vBar.position.set(bld.x, roofY + 0.7, bld.z + bld.depth * 0.4);
        scene.add(vBar);
        mesh.userData.roofAddons.push(vBar);

        const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.15), redCrossMat);
        hBar.position.set(bld.x, roofY + 0.7, bld.z + bld.depth * 0.4);
        scene.add(hBar);
        mesh.userData.roofAddons.push(hBar);
      } else if (bld.floors >= 7) {
        const penthouse = new THREE.Mesh(new THREE.BoxGeometry(bld.width * 0.5, 0.9, bld.depth * 0.45), hvacMat);
        penthouse.position.set(bld.x, roofY + 0.45, bld.z);
        scene.add(penthouse);
        mesh.userData.roofAddons.push(penthouse);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 2.8, 6), antennaMat);
        antenna.position.set(bld.x + bld.width * 0.2, roofY + 1.4, bld.z);
        scene.add(antenna);
        mesh.userData.roofAddons.push(antenna);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.set(bld.x + bld.width * 0.2, roofY + 2.85, bld.z);
        scene.add(beacon);
        mesh.userData.roofAddons.push(beacon);
        beaconLightsRef.current.push(beacon);
      } else {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 12), tankMat);
        tank.position.set(bld.x - 0.3, roofY + 0.45, bld.z + 0.3);
        scene.add(tank);
        mesh.userData.roofAddons.push(tank);
      }

      scene.add(mesh);
      buildingMeshesRef.current.set(bld.id, mesh);
    });
  }

  function buildRealisticTrees(treeGroup: THREE.Group, cityData: CityDefinition) {
    treeGroup.clear();

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, flatShading: true });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7, flatShading: true });

    cityData.roads.forEach(road => {
      if (road.is_bridge) return;
      const len = Math.hypot(road.x2 - road.x1, road.z2 - road.z1);
      const angle = Math.atan2(road.z2 - road.z1, road.x2 - road.x1);
      const midX = (road.x1 + road.x2) / 2;
      const midZ = (road.z1 + road.z2) / 2;
      const treeDist = (road.width / 2) + 1.2;

      const numTrees = Math.floor(len / 8);
      for (let t = 1; t < numTrees; t++) {
        const frac = (t / numTrees) - 0.5;
        const side = t % 2 === 0 ? 1 : -1;
        const tx = midX + Math.cos(angle) * (frac * len) + Math.sin(angle) * (treeDist * side);
        const tz = midZ + Math.sin(angle) * (frac * len) + Math.cos(angle) * (treeDist * side);
        const ty = getTerrainElevation(tx, tz, cityData.terrain_heights);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.85, 6), trunkMat);
        trunk.position.set(tx, ty + 0.42, tz);
        treeGroup.add(trunk);

        const mat = t % 3 === 0 ? foliageMat1 : (t % 3 === 1 ? foliageMat2 : foliageMat3);
        const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + (t % 3) * 0.15), mat);
        leaves.position.set(tx, ty + 1.15, tz);
        treeGroup.add(leaves);
      }
    });
  }

  function buildRealisticVehicles(vehicleGroup: THREE.Group, cityData: CityDefinition) {
    vehicleGroup.clear();

    const carColors = [0x0284c7, 0xf8fafc, 0x1e293b, 0xf59e0b, 0x059669];
    const ambulanceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const fireTruckMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    const numVehicles = Math.min(24, Math.max(12, cityData.roads.length * 2));

    for (let i = 0; i < numVehicles; i++) {
      const g = new THREE.Group();
      const isAmbulance = i % 6 === 0;
      const isFireTruck = i % 6 === 1;
      let sirenLight: THREE.Mesh | null = null;

      if (isAmbulance) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.3), ambulanceMat);
        body.position.y = 0.25;
        g.add(body);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 1.32), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        stripe.position.y = 0.25;
        g.add(stripe);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.18), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        bar.position.y = 0.55;
        g.add(bar);
        sirenLight = bar;
      } else if (isFireTruck) {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.8), fireTruckMat);
        cab.position.y = 0.3;
        g.add(cab);
        const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
        ladder.position.y = 0.68;
        g.add(ladder);
        const flasher = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.18), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        flasher.position.y = 0.75;
        g.add(flasher);
        sirenLight = flasher;
      } else {
        const color = carColors[i % carColors.length];
        const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.2), bodyMat);
        body.position.y = 0.15;
        g.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.65), glassMat);
        cabin.position.set(0, 0.35, -0.05);
        g.add(cabin);
      }

      const wOffsets = [
        [-0.35, 0.12, 0.4],
        [0.35, 0.12, 0.4],
        [-0.35, 0.12, -0.4],
        [0.35, 0.12, -0.4]
      ];
      wOffsets.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        g.add(wheel);
      });

      const road = cityData.roads[i % cityData.roads.length];
      const frac = (i * 0.19) % 0.85 + 0.08;
      const vx = road.x1 + (road.x2 - road.x1) * frac;
      const vz = road.z1 + (road.z2 - road.z1) * frac;
      const vy = road.is_bridge ? 0.58 : (getTerrainElevation(vx, vz, cityData.terrain_heights) + 0.1);

      g.position.set(vx, vy, vz);
      const angle = Math.atan2(road.x2 - road.x1, road.z2 - road.z1);
      g.rotation.y = angle;

      g.userData = {
        road,
        frac,
        dir: i % 2 === 0 ? 1 : -1,
        speed: 0.14 + (i % 3) * 0.06,
        isEmergency: isAmbulance || isFireTruck,
        sirenLight
      };
      vehicleGroup.add(g);
    }
  }

  function spawnBarricade(group: THREE.Group, x1: number, z1: number, x2: number, z2: number, cityData: CityDefinition) {
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const groundY = getTerrainElevation(midX, midZ, cityData.terrain_heights);
    const angle = Math.atan2(x2 - x1, z2 - z1);

    const barrierGeom = new THREE.BoxGeometry(2.4, 0.6, 0.35);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.5,
      metalness: 0.2
    });
    const barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(midX, groundY + 0.3, midZ);
    barrier.rotation.y = angle;
    group.add(barrier);

    const flasher = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    flasher.position.set(midX, groundY + 0.68, midZ);
    group.add(flasher);
  }

  function buildRealisticLifelines(group: THREE.Group, cityData: CityDefinition) {
    group.clear();

    cityData.infrastructure.forEach(item => {
      const groundY = getTerrainElevation(item.x, item.z, cityData.terrain_heights);
      const g = new THREE.Group();
      g.position.set(item.x, groundY, item.z);

      let assetColor = 0x0284c7;
      if (item.type === 'hospital') assetColor = 0x0284c7;
      else if (item.type === 'power') assetColor = 0xf59e0b;
      else if (item.type === 'water') assetColor = 0x06b6d4;
      else if (item.type === 'telecom') assetColor = 0x8b5cf6;
      else if (item.type === 'shelter') assetColor = 0x10b981;

      const haloGeom = new THREE.TorusGeometry(2.6, 0.08, 8, 36);
      const haloMat = new THREE.MeshBasicMaterial({
        color: assetColor,
        transparent: true,
        opacity: 0.85
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.35;
      g.add(halo);
      g.userData = { halo, assetId: item.id, baseColor: assetColor };

      if (item.type === 'telecom') {
        const pylon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.8, 12, 6),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        pylon.position.y = 6.0;
        g.add(pylon);
        const dish = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 12), haloMat);
        dish.position.set(0, 11.2, 0);
        g.add(dish);
      } else if (item.type === 'water') {
        const tank = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 0.8, 24),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
        );
        tank.position.y = 0.4;
        g.add(tank);
        const waterInside = new THREE.Mesh(
          new THREE.CylinderGeometry(2.1, 2.1, 0.1, 24),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.4 })
        );
        waterInside.position.y = 0.78;
        g.add(waterInside);
      } else if (item.type === 'power') {
        const tr1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
        tr1.position.y = 0.7;
        g.add(tr1);
      }

      group.add(g);
    });
  }

  // Evacuation Pedestrian Agent Clusters
  function buildEvacuationAgents(group: THREE.Group, cityData: CityDefinition) {
    group.clear();
    const agentMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const agentGeom = new THREE.SphereGeometry(0.15, 6, 6);

    for (let a = 0; a < 36; a++) {
      const agent = new THREE.Mesh(agentGeom, agentMat);
      const roadIdx = a % cityData.roads.length;
      const road = cityData.roads[roadIdx];
      const frac = (a * 0.17) % 1.0;
      const px = road.x1 + (road.x2 - road.x1) * frac + (Math.random() - 0.5) * 0.8;
      const pz = road.z1 + (road.z2 - road.z1) * frac + (Math.random() - 0.5) * 0.8;
      const py = road.is_bridge ? 0.62 : (getTerrainElevation(px, pz, cityData.terrain_heights) + 0.18);

      agent.position.set(px, py, pz);
      agent.userData = { road, frac, speed: 0.08 + (a % 3) * 0.04 };
      group.add(agent);
    }
  }

  // 3D Visible Disaster Origin Beacon Marker
  function updateSourceBeacon(group: THREE.Group, center: [number, number], cityData: CityDefinition, marker?: { name: string; type: string }) {
    group.clear();
    const [cx, cz] = center;
    const groundY = getTerrainElevation(cx, cz, cityData.terrain_heights);

    // Tall pulsing mast
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 5.0, 8), mastMat);
    mast.position.set(cx, groundY + 2.5, cz);
    group.add(mast);

    // Glowing beacon diamond
    const beaconHead = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beaconHead.position.set(cx, groundY + 5.2, cz);
    group.add(beaconHead);

    // Ground wave ripple ring
    const groundRing = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
    );
    groundRing.rotateX(-Math.PI / 2);
    groundRing.position.set(cx, groundY + 0.1, cz);
    group.add(groundRing);
  }

  function spawnRubble(group: THREE.Group, x: number, z: number, count: number, type: HazardType, cityData: CityDefinition) {
    const groundY = getTerrainElevation(x, z, cityData.terrain_heights);
    const rubbleMat = new THREE.MeshStandardMaterial({
      color: type === 'fire' ? 0x1e293b : 0x64748b,
      roughness: 0.95
    });

    for (let k = 0; k < count; k++) {
      const size = 0.35 + (k % 3) * 0.18;
      const r = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.7, size), rubbleMat);
      const angle = k * 1.25;
      const dist = 0.8 + k * 0.25;
      r.position.set(x + Math.cos(angle) * dist, groundY + size * 0.35, z + Math.sin(angle) * dist);
      r.rotation.set(k * 0.3, k * 0.6, k * 0.2);
      group.add(r);
    }
  }

  function drawMinimap() {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const toScreen = (x: number, z: number) => [
      ((x + 36) / 72) * w,
      ((z + 36) / 72) * h
    ];

    // Water path
    if (city.river_path && city.river_path.length > 1) {
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      city.river_path.forEach(([px, pz], idx) => {
        const [sx, sy] = toScreen(px, pz);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    }

    // Roads
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    city.roads.forEach(road => {
      const [x1, y1] = toScreen(road.x1, road.z1);
      const [x2, y2] = toScreen(road.x2, road.z2);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Hazard Area
    const [hcx, hcz] = currentMetrics.hazard_center;
    const [sx, sy] = toScreen(hcx, hcz);
    const sRad = (currentMetrics.hazard_radius / 72) * w;

    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(3, sRad), 0, Math.PI * 2);
    ctx.fillStyle = hazardType === 'fire' ? 'rgba(239, 68, 68, 0.25)' : (hazardType === 'flood' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(245, 158, 11, 0.25)');
    ctx.fill();
    ctx.strokeStyle = hazardType === 'fire' ? '#ef4444' : (hazardType === 'flood' ? '#0284c7' : '#f59e0b');
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lifeline Assets
    city.infrastructure.forEach(item => {
      const [ix, iy] = toScreen(item.x, item.z);
      ctx.fillStyle = item.type === 'hospital' ? '#ef4444' : '#0284c7';
      ctx.beginPath();
      ctx.arc(ix, iy, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Disaster Origin Pin
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function setCameraPreset(mode: 'oblique' | 'top' | 'ground' | 'hospital' | 'source') {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraMode(mode);

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (mode === 'oblique') {
      cam.position.set(38, 38, 48);
      ctrl.target.set(0, 1.5, 0);
    } else if (mode === 'top') {
      cam.position.set(0, 68, 0.1);
      ctrl.target.set(0, 0, 0);
    } else if (mode === 'ground') {
      cam.position.set(-18, 4, -18);
      ctrl.target.set(0, 4, 0);
    } else if (mode === 'hospital') {
      const hosp = city.buildings.find(b => b.type === 'hospital');
      if (hosp) {
        const groundY = hosp.y ?? getTerrainElevation(hosp.x, hosp.z, city.terrain_heights);
        cam.position.set(hosp.x + 10, groundY + hosp.height + 8, hosp.z + 12);
        ctrl.target.set(hosp.x, groundY + hosp.height / 2, hosp.z);
      }
    } else if (mode === 'source') {
      const [cx, cz] = currentMetrics.hazard_center;
      const groundY = getTerrainElevation(cx, cz, city.terrain_heights);
      cam.position.set(cx + 12, groundY + 14, cz + 14);
      ctrl.target.set(cx, groundY + 2, cz);
    }
    ctrl.update();
  }

  // ==========================================
  // INITIALIZE THREE.JS SCENE ON MOUNT / CITY CHANGE
  // ==========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const width = Math.max(container.clientWidth, 600);
      const height = Math.max(container.clientHeight, 400);

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      scene.background = new THREE.Color(0xdbeafe);
      scene.fog = new THREE.FogExp2(0xe2e8f0, 0.007);

      const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 800);
      camera.position.set(38, 38, 48);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 - 0.03;
      controls.minDistance = 8;
      controls.maxDistance = 140;
      controls.target.set(0, 1.5, 0);
      controlsRef.current = controls;

      // Realistic Daylight Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x94a3b8, 1.15);
      hemiLight.position.set(0, 50, 0);
      scene.add(hemiLight);

      const sun = new THREE.DirectionalLight(0xfff8ea, 2.2);
      sun.position.set(40, 65, 30);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.near = 5;
      sun.shadow.camera.far = 160;
      sun.shadow.camera.left = -45;
      sun.shadow.camera.right = 45;
      sun.shadow.camera.top = 45;
      sun.shadow.camera.bottom = -45;
      sun.shadow.bias = -0.0005;
      scene.add(sun);

      // Rain Particles (Weather System)
      const rainCount = 800;
      const rainGeom = new THREE.BufferGeometry();
      const rainPos = new Float32Array(rainCount * 3);
      for (let p = 0; p < rainCount * 3; p += 3) {
        rainPos[p] = (Math.random() - 0.5) * 75;
        rainPos[p + 1] = Math.random() * 35;
        rainPos[p + 2] = (Math.random() - 0.5) * 75;
      }
      rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.18,
        transparent: true,
        opacity: 0.6
      });
      const rainPoints = new THREE.Points(rainGeom, rainMat);
      rainPoints.visible = hazardType === 'flood';
      scene.add(rainPoints);
      rainParticlesRef.current = rainPoints;

      // Add Groups to Scene
      scene.add(terrainGroupRef.current);
      scene.add(roadGroupRef.current);
      scene.add(sidewalkGroupRef.current);
      scene.add(treeGroupRef.current);
      scene.add(streetLightGroupRef.current);
      scene.add(assetGroupRef.current);
      scene.add(hazardGroupRef.current);
      scene.add(vehicleGroupRef.current);
      scene.add(debrisGroupRef.current);
      scene.add(evacAgentsGroupRef.current);
      scene.add(sourceBeaconRef.current);

      // Build 3D World for selected city
      buildRealisticTerrain(terrainGroupRef.current, city);
      buildRealisticRoadsAndSidewalks(roadGroupRef.current, sidewalkGroupRef.current, streetLightGroupRef.current, city);
      buildRealisticBuildings(scene, city);
      buildRealisticTrees(treeGroupRef.current, city);
      buildRealisticVehicles(vehicleGroupRef.current, city);
      buildRealisticLifelines(assetGroupRef.current, city);
      buildEvacuationAgents(evacAgentsGroupRef.current, city);

      // Click Raycaster for Building Selection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handlePointerDown = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Placement mode lets operators pick any point in the active 3D city, not just preset origins.
        if (placingSourceRef.current && onSetSourceOrigin) {
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hitPoint = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
            const x = Math.max(-38, Math.min(38, hitPoint.x));
            const z = Math.max(-38, Math.min(38, hitPoint.z));
            onSetSourceOrigin(Number(x.toFixed(1)), Number(z.toFixed(1)));
            setIsPlacingSource(false);
            placingSourceRef.current = false;
            return;
          }
        }

        const meshes: THREE.Mesh[] = Array.from(buildingMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const bldData = hit.userData.building as BuildingData;
          if (bldData) {
            onSelectBuilding(bldData);
          }
        } else {
          if (event.target === renderer.domElement) {
            onSelectBuilding(null);
          }
        }
      };

      renderer.domElement.addEventListener('pointerdown', handlePointerDown);

      const handleResize = () => {
        if (!container || !rendererRef.current || !cameraRef.current) return;
        const w = Math.max(container.clientWidth, 300);
        const h = Math.max(container.clientHeight, 250);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // Animation Loop
      let timeAcc = 0;
      const animate = () => {
        animFrameId.current = requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();
        timeAcc += delta;

        controls.update();

        // Animate River Water Surface
        if (waterMeshRef.current) {
          waterMeshRef.current.position.y = -0.68 + Math.sin(timeAcc * 2) * 0.03;
        }

        // Animate Weather Rain Particles
        if (rainParticlesRef.current && rainParticlesRef.current.visible) {
          const posAttr = rainParticlesRef.current.geometry.attributes.position;
          for (let p = 1; p < posAttr.count * 3; p += 3) {
            let y = posAttr.array[p] - delta * 32.0;
            if (y < 0) y = 35.0;
            posAttr.array[p] = y;
          }
          posAttr.needsUpdate = true;
        }

        // Animate Moving Cars & Emergency Vehicles along real routes
        vehicleGroupRef.current.children.forEach(grp => {
          const road = grp.userData.road;
          if (road) {
            const isEmergency = grp.userData.isEmergency;
            const status = currentMetrics.road_status[road.id] || 'open';
            if (status === 'impassable' && !isEmergency) {
              return;
            }
            const speed = grp.userData.speed || 0.18;
            const dir = grp.userData.dir || 1;
            grp.userData.frac = (grp.userData.frac || 0) + delta * speed * dir;
            if (grp.userData.frac > 0.92) {
              grp.userData.frac = 0.92;
              grp.userData.dir = -1;
            } else if (grp.userData.frac < 0.08) {
              grp.userData.frac = 0.08;
              grp.userData.dir = 1;
            }
            const f = grp.userData.frac;
            const px = road.x1 + (road.x2 - road.x1) * f;
            const pz = road.z1 + (road.z2 - road.z1) * f;
            const py = road.is_bridge ? 0.58 : (getTerrainElevation(px, pz, city.terrain_heights) + 0.1);
            grp.position.set(px, py, pz);

            if (isEmergency && grp.userData.sirenLight) {
              const strobe = Math.sin(timeAcc * 14) > 0;
              (grp.userData.sirenLight.material as THREE.MeshBasicMaterial).color.setHex(strobe ? 0xef4444 : 0x3b82f6);
            }
          }
        });

        // Animate Evacuation Pedestrian Agents along real routes
        evacAgentsGroupRef.current.children.forEach(agent => {
          const speed = agent.userData.speed || 0.06;
          const road = agent.userData.road;
          if (road) {
            const status = currentMetrics.road_status[road.id] || 'open';
            if (status === 'impassable') {
              agent.userData.frac = Math.max(0, agent.userData.frac - delta * speed * 0.4);
            } else {
              const rate = status === 'congested' ? speed * 0.35 : speed;
              agent.userData.frac = (agent.userData.frac + delta * rate) % 1.0;
            }
            const f = agent.userData.frac;
            const px = road.x1 + (road.x2 - road.x1) * f;
            const pz = road.z1 + (road.z2 - road.z1) * f;
            const py = road.is_bridge ? 0.62 : (getTerrainElevation(px, pz, city.terrain_heights) + 0.18);
            agent.position.set(px, py, pz);
          }
        });

        // Blinking Red Aviation Lights on Skyscrapers
        const beaconOn = Math.sin(timeAcc * 4) > 0;
        beaconLightsRef.current.forEach(b => {
          b.visible = beaconOn;
        });

        // Animate Lifeline Hologram Halos
        assetGroupRef.current.children.forEach(group => {
          const halo = group.userData.halo as THREE.Mesh;
          if (halo) halo.rotation.z += delta * 0.75;
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.dispose();
      };
    } catch (err: unknown) {
      console.error('Failed to initialize Three.js:', err);
      setWebglError(err instanceof Error ? err.message : 'Unknown WebGL failure');
    }
  }, [city]);

  // ==========================================
  // UPDATE HAZARD & SOURCE MARKER
  // ==========================================
  useEffect(() => {
    drawMinimap();

    // Toggle Rain Particle Visibility
    if (rainParticlesRef.current) {
      rainParticlesRef.current.visible = hazardType === 'flood';
    }

    const hazardGroup = hazardGroupRef.current;
    const debrisGroup = debrisGroupRef.current;
    hazardGroup.clear();
    debrisGroup.clear();

    const [cx, cz] = currentMetrics.hazard_center;
    const hazard_radius = currentMetrics.hazard_radius;
    const centerGroundY = getTerrainElevation(cx, cz, city.terrain_heights);

    // Update 3D Source Beacon Marker
    updateSourceBeacon(sourceBeaconRef.current, [cx, cz], city, currentMetrics.source_marker);

    if (hazardType === 'flood') {
      const floodGeom = new THREE.CylinderGeometry(hazard_radius, hazard_radius * 1.05, 0.45, 36);
      const floodMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.78,
        roughness: 0.1,
        metalness: 0.4
      });
      const floodDisc = new THREE.Mesh(floodGeom, floodMat);
      floodDisc.position.set(cx, centerGroundY + 0.15, cz);
      hazardGroup.add(floodDisc);
    } else if (hazardType === 'fire') {
      const numFlames = Math.min(24, Math.max(8, Math.floor(hazard_radius * 1.8)));
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const smokeMat = new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.4, depthWrite: false });

      for (let i = 0; i < numFlames; i++) {
        const angle = i * 2.39996;
        const dist = hazard_radius * Math.sqrt((i + 1) / numFlames);
        const fx = cx + Math.cos(angle) * dist;
        const fz = cz + Math.sin(angle) * dist;
        const fgy = getTerrainElevation(fx, fz, city.terrain_heights);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35 + (i % 3) * 0.12, 1.2 + (i % 4) * 0.35, 6), flameMat);
        flame.position.set(fx, fgy + 0.6, fz);
        hazardGroup.add(flame);

        if (i % 3 === 0) {
          const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.7 + (i % 3) * 0.25, 8, 8), smokeMat);
          smoke.position.set(fx, fgy + 2.2 + (i % 4) * 0.5, fz);
          smoke.scale.set(1.2, 1.8, 1.2);
          hazardGroup.add(smoke);
        }
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        const ringR = (i * hazard_radius) / 5;
        const ringGeom = new THREE.RingGeometry(ringR, ringR + 0.4, 72);
        ringGeom.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: i < 3 ? 0xef4444 : 0xf59e0b,
          transparent: true,
          opacity: Math.max(0.2, 0.75 - i * 0.1),
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.set(cx, centerGroundY + 0.12 + i * 0.01, cz);
        hazardGroup.add(ring);
      }
    }

    // Realistic Building Damage Transitions
    buildingMeshesRef.current.forEach((mesh, bldId) => {
      const stage = currentMetrics.buildings_stage[bldId] || 'intact';
      const bldData = mesh.userData.building as BuildingData;
      if (!bldData) return;

      const groundY = mesh.userData.groundY ?? getTerrainElevation(bldData.x, bldData.z, city.terrain_heights);
      mesh.scale.set(1, 1, 1);
      mesh.position.set(bldData.x, groundY + bldData.height / 2, bldData.z);
      mesh.rotation.set(0, 0, 0);

      const bldMat = mesh.material as THREE.MeshStandardMaterial;

      if (stage === 'intact') {
        bldMat.color.setHex(0xffffff);
        bldMat.emissive.setHex(0x000000);
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = true; });
      } else if (stage === 'minor') {
        bldMat.color.setHex(hazardType === 'fire' ? 0x94a3b8 : 0xcbd5e1);
        bldMat.emissive.setHex(hazardType === 'fire' ? 0x4a180b : 0x000000);
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = true; });
      } else if (stage === 'moderate') {
        bldMat.color.setHex(hazardType === 'fire' ? 0x64748b : 0x94a3b8);
        bldMat.emissive.setHex(hazardType === 'fire' ? 0x991b1b : 0x000000);
        if (hazardType === 'quake') mesh.rotation.z = 0.03 * Math.sin(bldData.x * 2.1);
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = true; });
      } else if (stage === 'severe') {
        bldMat.color.setHex(hazardType === 'fire' ? 0x334155 : 0x64748b);
        bldMat.emissive.setHex(hazardType === 'fire' ? 0xdc2626 : 0x000000);
        mesh.rotation.z = 0.08 * Math.sin(bldData.x * 1.5);
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = true; });
      } else if (stage === 'critical') {
        bldMat.color.setHex(0x1e293b);
        const scaleY = 0.45;
        mesh.scale.y = scaleY;
        mesh.position.y = groundY + (bldData.height * scaleY) / 2;
        mesh.rotation.z = 0.14 * Math.sin(bldData.x);
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = false; });
        spawnRubble(debrisGroup, bldData.x, bldData.z, 5, hazardType, city);
      } else if (stage === 'destroyed') {
        bldMat.color.setHex(0x0f172a);
        const scaleY = 0.15;
        mesh.scale.y = scaleY;
        mesh.position.y = groundY + (bldData.height * scaleY) / 2;
        mesh.rotation.z = 0.22;
        mesh.userData.roofAddons?.forEach((a: THREE.Object3D) => { a.visible = false; });
        spawnRubble(debrisGroup, bldData.x, bldData.z, 8, hazardType, city);
      }
    });

    // Road Status Colors and 3D Barricades
    roadGroupRef.current.children.forEach(obj => {
      const roadId = obj.userData.roadId as string;
      if (!roadId) return;
      const status = currentMetrics.road_status[roadId] || 'open';
      const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;

      if (status === 'impassable') {
        m.color.setHex(0xef4444);
        if (overlays.roadBarricades) {
          const road = city.roads.find(r => r.id === roadId);
          if (road) {
            spawnBarricade(debrisGroup, road.x1, road.z1, road.x2, road.z2, city);
          }
        }
      } else if (status === 'congested' || status === 'threatened') {
        m.color.setHex(0xf59e0b);
      } else {
        m.color.setHex(0xffffff);
      }
    });

    // Critical Asset Halos
    assetGroupRef.current.children.forEach(grp => {
      const assetId = grp.userData.assetId as string;
      if (!assetId) return;
      const status = currentMetrics.infrastructure_status[assetId] || 'operational';
      const halo = grp.userData.halo as THREE.Mesh;
      if (halo) {
        if (status === 'offline') {
          (halo.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        } else if (status === 'degraded') {
          (halo.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
        } else {
          (halo.material as THREE.MeshBasicMaterial).color.setHex(grp.userData.baseColor);
        }
      }
    });
  }, [currentMetrics, hazardType, branchId, overlays]);

  if (webglError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">3D WebGL Context Notice</h3>
        <p className="text-xs text-slate-500 max-w-md mt-1">{webglError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[380px] overflow-hidden select-none bg-sky-50">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing" />

      {/* Floating Tactical Header Badge with Disaster Origin Information */}
      <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-500/5">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
        <div>
          <div className="text-xs font-black tracking-wider text-slate-900 uppercase flex items-center gap-2">
            <span>DISASTER ORIGIN PIN</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              ACTIVE SOURCE
            </span>
          </div>
          <div className="text-[11px] font-bold text-blue-700">
            {currentMetrics.source_marker?.name || 'Primary Hazard Front'}
          </div>
          <div className="text-[10px] text-slate-500 max-w-xs truncate">
            {currentMetrics.source_marker?.desc || 'Simulated hydraulic / thermal incursion'}
          </div>
        </div>
      </div>

      {/* Click-to-place source control */}
      <div className="absolute bottom-5 left-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsPlacingSource(value => !value)}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-xl border transition ${isPlacingSource ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-slate-950/90 text-white border-cyan-400/50 hover:bg-cyan-950'}`}
          title="Choose a new disaster source by clicking the 3D city"
        >
          <MapPin className="inline w-4 h-4 mr-2" />{isPlacingSource ? 'CLICK CITY TO PLACE SOURCE' : 'PLACE DISASTER SOURCE'}
        </button>
        {isPlacingSource && <span className="rounded-lg bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-800 shadow">Click a point in the 3D view. Coordinates are local to this city model.</span>}
      </div>

      {/* Camera Controls Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 p-1.5 rounded-2xl shadow-lg shadow-blue-500/5 z-10">
        <button
          onClick={() => setCameraPreset('oblique')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            cameraMode === 'oblique' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          AERIAL 3D
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            cameraMode === 'top' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          TOP-DOWN GIS
        </button>
        <button
          onClick={() => setCameraPreset('ground')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            cameraMode === 'ground' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          STREET
        </button>
        <button
          onClick={() => setCameraPreset('source')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1 ${
            cameraMode === 'source' ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>SOURCE PIN</span>
        </button>
        <button
          onClick={() => setCameraPreset('hospital')}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1"
        >
          🏥 HOSPITAL FOCUS
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

        {/* Google 3D Tiles vs Synthetic Toggle */}
        <button
          onClick={() => setTilesMode(prev => prev === 'synthetic' ? 'google_3d' : 'synthetic')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
            tilesMode === 'google_3d'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle between Calibrated Synthetic Twin and Google Photorealistic 3D Tiles"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{tilesMode === 'google_3d' ? '3D TILES: ON' : '3D TILES'}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={handleToggleFullscreen}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen 3D View'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="text-[10px] hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULL'}</span>
        </button>
      </div>

      {/* Google 3D Tiles Status Notification (when toggled without key) */}
      {tilesMode === 'google_3d' && !googleApiKey && (
        <div className="absolute top-16 left-4 z-20 max-w-sm bg-white/95 backdrop-blur-md border border-amber-300 rounded-2xl p-3.5 shadow-xl shadow-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Google Photorealistic 3D Tiles</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded">ENV CONFIG</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                <code className="text-amber-700 font-mono text-[10px]">VITE_GOOGLE_MAPS_API_KEY</code> is not set in environment. Using Calibrated Synthetic Digital Twin calibrated to <strong>{city.name || 'Metropolitan Twin'}</strong> ({city.lat != null ? city.lat.toFixed(3) : '17.385'}°N, {city.lon != null ? city.lon.toFixed(3) : '78.486'}°E) with active hazard overlays.
              </p>
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">Map data © 2026 Google</span>
                <button
                  onClick={() => setTilesMode('synthetic')}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  Return to Synthetic Twin →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geodetic Datum & Mandatory Google Attribution Badge */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto flex flex-col items-end gap-1">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-md text-[10px] text-slate-600 flex items-center gap-2">
          {tilesMode === 'google_3d' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">SOURCE:</span>
              <span>Google 3D Tiles (WGS84) + Real-Time Disaster Overlays</span>
              <span className="text-slate-300">|</span>
              <span className="font-bold text-slate-700">Map data © 2026 Google</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-semibold text-slate-800">SOURCE:</span>
              <span>Calibrated Synthetic Twin (EPSG:3857 MSL Datum)</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-600">{city.name || 'Metropolitan Twin'} ({city.lat != null ? city.lat.toFixed(3) : '17.385'}°N, {city.lon != null ? city.lon.toFixed(3) : '78.486'}°E)</span>
            </>
          )}
        </div>
      </div>

      {/* Collapsible Map Tools & Radar Drawer */}
      <MapToolsDrawer
        minimapCanvasRef={minimapCanvasRef}
        overlays={overlays}
        onToggleOverlay={(key) => setOverlays(prev => ({ ...prev, [key]: !prev[key] }))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  );
};
