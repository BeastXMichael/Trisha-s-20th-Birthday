/**
 * PathGraph - Strict node-based navigation system for the yellow path
 *
 * CONSTRAINTS:
 * - Character can ONLY stand on the 11 yellow circles (nodes)
 * - Character can ONLY move along the yellow lines (edges)
 * - No shortcuts or off-path movement allowed
 */

export interface PathNode {
  id: string;
  x: number;
  y: number;
  levelIndex: number; // -1 for path nodes, 0-5 for levels, 6 for finish
  name: string;
}

export interface PathEdge {
  from: string;
  to: string;
  // Waypoints define the curve of the yellow line between nodes
  // These are intermediate points the character must pass through
  waypoints: { x: number; y: number }[];
}

// Map dimensions: 1280x720
// EXACTLY 11 yellow circles as shown on the map

export const PATH_NODES: PathNode[] = [
  // 0: START - Cinnamoroll arch at top-left
  { id: 'start', x: 185, y: 210, levelIndex: -1, name: 'Start' },

  // 1: SUPERCAR DEALERSHIP - greenhouse building (Level 1: Car)
  { id: 'supercar', x: 390, y: 225, levelIndex: 0, name: 'Supercar Dealership' },

  // 2: MEXICAN RESTAURANT - colorful building upper-right (Level 2: Food)
  { id: 'mexican', x: 700, y: 270, levelIndex: 1, name: 'Mexican Restaurant' },

  // 3: PATH NODE - yellow circle curving down from Mexican toward Matcha
  { id: 'path_curve', x: 455, y: 300, levelIndex: -1, name: 'Path' },

  // 4: MATCHA CAFE - left side with bamboo (Level 3: Matcha)
  { id: 'matcha', x: 407, y: 480, levelIndex: 2, name: 'Matcha Cafe' },

  // 5: SAILING IN THE SEA - bottom-left water area (Level 4: Sailing)
  { id: 'sailing', x: 245, y: 565, levelIndex: 3, name: 'Sailing in the Sea' },

  // 6: PATH NODE - yellow circle on sunset terrace path
  { id: 'path_terrace', x: 690, y: 600, levelIndex: -1, name: 'Path' },

  // 7: SUNSET AREA - terraced beach viewing area (Level 5: Photo)
  { id: 'sunset', x: 670, y: 500, levelIndex: 4, name: 'Sunset Area' },

  // 8: PATH NODE - yellow circle going up toward Mountain
  { id: 'path_mountain', x: 870, y: 320, levelIndex: -1, name: 'Path' },

  // 9: MOUNTAIN DINNER - elevated restaurant top-right (Level 6: Dinner)
  { id: 'mountain', x: 1116, y: 265, levelIndex: 5, name: 'Mountain Dinner' },

  // 10: FINISH - treasure chest at bottom-right
  { id: 'finish', x: 935, y: 500, levelIndex: 6, name: 'Finish' },
];

// Edges define the yellow lines connecting nodes
// Waypoints trace the EXACT curve of the yellow path
export const PATH_EDGES: PathEdge[] = [
  // START -> SUPERCAR (curve along top)
  {
    from: 'start',
    to: 'supercar',
    waypoints: [
      { x: 340, y: 265},
    ]
  },

  // SUPERCAR -> MEXICAN (curve along top)
  {
    from: 'supercar',
    to: 'mexican',
    waypoints: [
      { x: 355, y: 265 },
      { x: 455, y: 290 },
      { x: 630, y: 300 },
    ]
  },

  // MEXICAN -> PATH_CURVE (curves down and left)
  {
    from: 'mexican',
    to: 'path_curve',
    waypoints: [
      { x: 630, y: 300 },
    ]
  },

  // PATH_CURVE -> MATCHA (curves down to left)
  {
    from: 'path_curve',
    to: 'matcha',
    waypoints: [
      { x: 375, y: 410 },
    ]
  },

  // MATCHA -> SAILING (curves down)
  {
    from: 'matcha',
    to: 'sailing',
    waypoints: [
    ]
  },

  // SAILING -> PATH_TERRACE (curves right along terrace)
  {
    from: 'sailing',
    to: 'path_terrace',
    waypoints: [
      { x: 407, y: 490 },
      { x: 580, y: 600 },
      
    ]
  },

  // PATH_TERRACE -> SUNSET (curves up-right)
  {
    from: 'path_terrace',
    to: 'sunset',
    waypoints: [
    ]
  },

  // SUNSET -> MOUNTAIN (curves up to restaurant)
  {
    from: 'sunset',
    to: 'mountain',
    waypoints: [

    ]
  },

  // MOUNTAIN -> FINISH (curves down to treasure)
  {
    from: 'mountain',
    to: 'finish',
    waypoints: [
    ]
  },
];

/**
 * PathGraph class for strict path-constrained navigation
 */
export class PathGraph {
  private nodes: Map<string, PathNode> = new Map();
  private nodeList: PathNode[] = [];
  private edges: Map<string, PathEdge[]> = new Map();
  private edgeMap: Map<string, PathEdge> = new Map(); // "from->to" key

  constructor() {
    this.buildGraph();
  }

  private buildGraph(): void {
    // Index nodes
    PATH_NODES.forEach((node) => {
      this.nodes.set(node.id, node);
      this.nodeList.push(node);
    });

    // Initialize edge lists
    PATH_NODES.forEach(node => {
      this.edges.set(node.id, []);
    });

    // Index edges (bidirectional)
    PATH_EDGES.forEach(edge => {
      // Forward edge
      this.edges.get(edge.from)?.push(edge);
      this.edgeMap.set(`${edge.from}->${edge.to}`, edge);

      // Reverse edge (with reversed waypoints)
      const reverseEdge: PathEdge = {
        from: edge.to,
        to: edge.from,
        waypoints: [...edge.waypoints].reverse()
      };
      this.edges.get(edge.to)?.push(reverseEdge);
      this.edgeMap.set(`${edge.to}->${edge.from}`, reverseEdge);
    });
  }

  getNode(id: string): PathNode | undefined {
    return this.nodes.get(id);
  }

  getNodeByIndex(index: number): PathNode | undefined {
    return this.nodeList[index];
  }

  getNodeIndex(id: string): number {
    return this.nodeList.findIndex(n => n.id === id);
  }

  getNodeCount(): number {
    return this.nodeList.length;
  }

  getAllNodes(): PathNode[] {
    return this.nodeList;
  }

  getEdgesFrom(nodeId: string): PathEdge[] {
    return this.edges.get(nodeId) || [];
  }

  getEdgeBetween(fromId: string, toId: string): PathEdge | undefined {
    return this.edgeMap.get(`${fromId}->${toId}`);
  }

  areAdjacent(nodeId1: string, nodeId2: string): boolean {
    return this.edgeMap.has(`${nodeId1}->${nodeId2}`);
  }

  getAdjacentNodeIds(nodeId: string): string[] {
    const edges = this.edges.get(nodeId);
    return edges?.map(e => e.to) ?? [];
  }

  /**
   * Get all points along an edge path (start -> waypoints -> end)
   * These define the exact yellow line the character must follow
   */
  getPathPoints(edge: PathEdge): { x: number; y: number }[] {
    const fromNode = this.nodes.get(edge.from);
    const toNode = this.nodes.get(edge.to);

    if (!fromNode || !toNode) return [];

    return [
      { x: fromNode.x, y: fromNode.y },
      ...edge.waypoints,
      { x: toNode.x, y: toNode.y }
    ];
  }

  /**
   * Generate smooth interpolated points along the path using Catmull-Rom spline
   * @param edge The edge to interpolate
   * @param numPoints Total points to generate for smooth movement
   */
  getInterpolatedPath(edge: PathEdge, numPoints: number = 40): { x: number; y: number }[] {
    const pathPoints = this.getPathPoints(edge);

    if (pathPoints.length < 2) return pathPoints;
    if (pathPoints.length === 2) {
      // Linear interpolation for straight lines
      return this.linearInterpolate(pathPoints[0], pathPoints[1], numPoints);
    }

    // Use Catmull-Rom spline for smooth curves
    return this.catmullRomSpline(pathPoints, numPoints);
  }

  /**
   * Linear interpolation between two points
   */
  private linearInterpolate(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    numPoints: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      points.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      });
    }
    return points;
  }

  /**
   * Catmull-Rom spline interpolation for smooth curved paths
   */
  private catmullRomSpline(
    controlPoints: { x: number; y: number }[],
    numPoints: number
  ): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];

    // Extend endpoints for smooth edges
    const extended = [
      controlPoints[0],
      ...controlPoints,
      controlPoints[controlPoints.length - 1]
    ];

    const segments = extended.length - 3;
    const pointsPerSegment = Math.ceil(numPoints / segments);

    for (let i = 0; i < segments; i++) {
      const p0 = extended[i];
      const p1 = extended[i + 1];
      const p2 = extended[i + 2];
      const p3 = extended[i + 3];

      for (let j = 0; j < pointsPerSegment; j++) {
        // Skip duplicate points at segment joins
        if (i > 0 && j === 0) continue;

        const t = j / (pointsPerSegment - 1);
        result.push(this.catmullRomPoint(p0, p1, p2, p3, t));
      }
    }

    return result;
  }

  /**
   * Calculate a point on a Catmull-Rom spline segment
   */
  private catmullRomPoint(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;

    // Catmull-Rom basis functions
    const b0 = -0.5 * t3 + t2 - 0.5 * t;
    const b1 = 1.5 * t3 - 2.5 * t2 + 1;
    const b2 = -1.5 * t3 + 2 * t2 + 0.5 * t;
    const b3 = 0.5 * t3 - 0.5 * t2;

    return {
      x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
      y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y
    };
  }

  /**
   * Calculate total arc length of a path
   */
  getPathLength(points: { x: number; y: number }[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Find the nearest node to a given position
   */
  getNearestNode(x: number, y: number): PathNode | undefined {
    let nearest: PathNode | undefined;
    let minDist = Infinity;

    for (const node of this.nodeList) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }
}

// Export singleton instance
export const pathGraph = new PathGraph();
