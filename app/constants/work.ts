import * as THREE from "three";
import { WorkTimelinePoint } from "../types";

export const WORK_TIMELINE: WorkTimelinePoint[] = [
  {
    point: new THREE.Vector3(0, 0, 0),
    year: '2026',
    title: 'Autonomous Multi-Agent System',
    subtitle: 'In Progress',
    position: 'right',
  },
  {
    point: new THREE.Vector3(-2, -4, -3),
    year: '2026',
    title: 'Account Payable Invoice Data Automation',
    subtitle: 'RPA, Python, Azure Blob',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-8, -1, -6),
    year: '2025',
    title: 'P2P Purchase Order Closing & Re-Opening Automation',
    subtitle: 'RPA, SAP',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-2, 3, -5),
    year: '2024',
    title: 'Power Automate Flow for Mitigation response',
    subtitle: 'Power Automate',
    position: 'right',
  },
  {
    point: new THREE.Vector3(4, 5, -7),
    year: '2023',
    title: 'infrastructure optimization for the PBNA sector',
    subtitle: 'RPA, UiPath Orchestrator',
    position: 'right',
  }
]