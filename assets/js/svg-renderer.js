// [ANCHOR: JS-SVG-RENDERER]
(function() {
  class SvgRenderer {
    constructor(svgElement, onSelectNode) {
      this.svg = svgElement;
      this.linksGroup = svgElement.querySelector("#linksGroup");
      this.nodesGroup = svgElement.querySelector("#nodesGroup");
      this.labelsGroup = svgElement.querySelector("#labelsGroup");
      this.onSelectNode = onSelectNode;
    }

    // 計算折線/直線幾何座標與端點 (避免穿入節點卡內部)
    calculateEdgeGeom(a, b) {
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

      // 同一水平行 (水平直連)
      if (a.y === b.y) {
        if (a.x < b.x) {
          // 由左向右
          return {
            d: `M ${a.x + a.w} ${ac.y} L ${b.x - 2} ${bc.y}`,
            lx: (a.x + a.w + b.x) / 2,
            ly: ac.y
          };
        } else {
          // 由右向左 (折返)
          return {
            d: `M ${a.x} ${ac.y} L ${b.x + b.w + 2} ${bc.y}`,
            lx: (a.x + b.x + b.w) / 2,
            ly: ac.y
          };
        }
      }

      // 同一垂直列 (垂直直連)
      if (a.x === b.x) {
        if (a.y < b.y) {
          // 由上向下
          return {
            d: `M ${ac.x} ${a.y + a.h} L ${bc.x} ${b.y - 2}`,
            lx: ac.x,
            ly: (a.y + a.h + b.y) / 2
          };
        } else {
          // 由下向上
          return {
            d: `M ${ac.x} ${a.y} L ${bc.x} ${b.y + b.h + 2}`,
            lx: ac.x,
            ly: (a.y + b.y + b.h) / 2
          };
        }
      }

      // 跨行/跨列折線連接 (S 型或階梯型)
      const midY = (ac.y + bc.y) / 2;
      return {
        d: `M ${ac.x} ${a.y + a.h} L ${ac.x} ${midY} L ${bc.x} ${midY} L ${bc.x} ${b.y - 2}`,
        lx: (ac.x + bc.x) / 2,
        ly: midY
      };
    }

    render(state) {
      this.linksGroup.innerHTML = "";
      this.nodesGroup.innerHTML = "";
      if (this.labelsGroup) this.labelsGroup.innerHTML = "";

      const nodeMap = new Map(state.nodes.map(n => [n.id, n]));

      // 1. 繪製連線 (Flow Links)
      window.FLOW_LINKS.forEach(link => {
        const fromNode = nodeMap.get(link.from);
        const toNode = nodeMap.get(link.to);
        if (!fromNode || !toNode) return;

        const geom = this.calculateEdgeGeom(fromNode, toNode);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", geom.d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#64748b");
        path.setAttribute("stroke-width", "2.2");
        path.setAttribute("marker-end", "url(#arrow)");

        let isDimmed = false;
        let isHighlight = false;

        // 視圖過濾規則
        if (state.currentView === "trace" && !link.trace) {
          isDimmed = true;
        } else if (state.currentView === "audit" && !link.audit) {
          isDimmed = true;
        }

        if (link.from === state.selectedNodeId || link.to === state.selectedNodeId) {
          isHighlight = true;
          path.setAttribute("marker-end", "url(#arrow-active)");
        }

        path.setAttribute("class", `flow-link ${isDimmed ? 'dimmed' : ''} ${isHighlight ? 'highlight' : ''}`);
        this.linksGroup.appendChild(path);

        // 資料流視圖專屬：顯示連線資料流標籤 (帶氣泡膠囊背景，且置於頂層 labelsGroup)
        if (state.currentView === "data" && (isHighlight || !state.selectedNodeId)) {
          this.drawEdgeLabel(geom.lx, geom.ly, link.label);
        }
      });

      // 2. 繪製節點 Box (Nodes)
      state.nodes.forEach(node => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const isSelected = node.id === state.selectedNodeId;
        const isAuditFocus = state.currentView === "audit" && window.AUDIT_NODES.includes(node.id);
        
        let nodeClass = "node-box";
        if (isSelected) nodeClass += " selected";
        if (isAuditFocus) nodeClass += " highlight-audit";
        if (state.currentView === "audit" && !window.AUDIT_NODES.includes(node.id)) nodeClass += " dimmed";

        g.setAttribute("class", nodeClass);
        g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        g.onclick = () => this.onSelectNode(node.id);

        const groupColor = this.getGroupColors(node.group);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", node.w);
        rect.setAttribute("height", node.h);
        rect.setAttribute("rx", "10");
        rect.setAttribute("fill", groupColor.bg);
        rect.setAttribute("stroke", groupColor.border);
        rect.setAttribute("stroke-width", "1.5");

        // 標題 Text
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.setAttribute("x", "12");
        title.setAttribute("y", "26");
        title.setAttribute("fill", groupColor.text);
        title.setAttribute("font-size", "14");
        title.setAttribute("font-weight", "bold");
        title.textContent = node.name;

        // 次標題 Text
        const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sub.setAttribute("x", "12");
        sub.setAttribute("y", "46");
        sub.setAttribute("fill", "#94a3b8");
        sub.setAttribute("font-size", "10");
        sub.textContent = node.type || "";

        // 簡短標籤 Text
        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lbl.setAttribute("x", "12");
        lbl.setAttribute("y", "62");
        lbl.setAttribute("fill", "#cbd5e1");
        lbl.setAttribute("font-size", "9");
        lbl.textContent = (node.label || "").substring(0, 24) + ((node.label || "").length > 24 ? "..." : "");

        g.appendChild(rect);
        g.appendChild(title);
        g.appendChild(sub);
        g.appendChild(lbl);

        this.nodesGroup.appendChild(g);
      });
    }

    // 繪製具備獨立高對比背景膠囊的連線標籤 (確保置頂且不被節點/連線遮擋)
    drawEdgeLabel(x, y, textStr) {
      const targetLayer = this.labelsGroup || this.nodesGroup;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "edge-label-group");
      g.setAttribute("transform", `translate(${x}, ${y})`);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", "3.5");
      text.setAttribute("fill", "var(--accent)");
      text.setAttribute("font-size", "10");
      text.setAttribute("font-weight", "700");
      text.setAttribute("text-anchor", "middle");
      text.textContent = textStr;

      // 膠囊底色背景
      const paddingX = 8;
      const widthEst = textStr.length * 11 + paddingX * 2;
      const heightEst = 18;

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", -widthEst / 2);
      bg.setAttribute("y", -heightEst / 2);
      bg.setAttribute("width", widthEst);
      bg.setAttribute("height", heightEst);
      bg.setAttribute("rx", "9");
      bg.setAttribute("fill", "var(--bg-card)");
      bg.setAttribute("stroke", "var(--accent)");
      bg.setAttribute("stroke-width", "1");
      bg.setAttribute("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

      g.appendChild(bg);
      g.appendChild(text);
      targetLayer.appendChild(g);
    }

    getGroupColors(group) {
      switch (group) {
        case "material": return { bg: "var(--c-material-bg)", border: "var(--c-material-border)", text: "var(--c-material-text)" };
        case "process":  return { bg: "var(--c-process-bg)",  border: "var(--c-process-border)",  text: "var(--c-process-text)" };
        case "check":    return { bg: "var(--c-check-bg)",    border: "var(--c-check-border)",    text: "var(--c-check-text)" };
        case "pack":     return { bg: "var(--c-pack-bg)",     border: "var(--c-pack-border)",     text: "var(--c-pack-text)" };
        default:         return { bg: "var(--bg-card)",        border: "var(--border)",            text: "var(--text-main)" };
      }
    }
  }

  window.SvgRenderer = SvgRenderer;
})();
