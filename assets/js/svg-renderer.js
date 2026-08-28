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

    calculateEdgeGeom(a, b) {
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

      // 1. 同一水平行直接直線連接 (如 aoi -> routing, print -> spi 等)
      if (Math.abs(a.y - b.y) < 5) {
        if (a.x < b.x) {
          return {
            d: `M ${a.x + a.w} ${ac.y} L ${b.x - 2} ${bc.y}`,
            lx: (a.x + a.w + b.x) / 2,
            ly: ac.y
          };
        } else {
          return {
            d: `M ${a.x} ${ac.y} L ${b.x + b.w + 2} ${bc.y}`,
            lx: (a.x + b.x + b.w) / 2,
            ly: ac.y
          };
        }
      }

      // 2. 同一垂直列直線連接
      if (Math.abs(a.x - b.x) < 5) {
        if (a.y < b.y) {
          return {
            d: `M ${ac.x} ${a.y + a.h} L ${bc.x} ${b.y - 2}`,
            lx: ac.x,
            ly: (a.y + a.h + b.y) / 2
          };
        } else {
          return {
            d: `M ${ac.x} ${a.y} L ${bc.x} ${b.y + b.h + 2}`,
            lx: ac.x,
            ly: (a.y + b.y + b.h) / 2
          };
        }
      }

      // 3. 支線分流情況 (如 aoi -> repair 或 repair -> routing)
      // 若水平方向為由右向左 (a.x > b.x) 且帶有垂直微幅下沉或回流：從左側邊界引出
      if (a.x > b.x && Math.abs(a.y - b.y) <= 40) {
        return {
          d: `M ${a.x} ${ac.y} L ${b.x + b.w + 2} ${bc.y}`,
          lx: (a.x + b.x + b.w) / 2,
          ly: (ac.y + bc.y) / 2
        };
      }

      // 4. 標準跨行/跨列階梯折線連接 (如 wo -> kitting, stencil -> print, reflow -> aoi)
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
      const isLight = state.theme === "light";

      // 1. 繪製連線 (Flow Links)
      window.FLOW_LINKS.forEach(link => {
        const fromNode = nodeMap.get(link.from);
        const toNode = nodeMap.get(link.to);
        if (!fromNode || !toNode) return;

        const geom = this.calculateEdgeGeom(fromNode, toNode);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", geom.d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", isLight ? "#94a3b8" : "#64748b");
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

        // 資料流視圖專屬：當選中節點時，強烈高亮顯示關聯的數據流膠囊；未選中時不全景堆疊擋線
        if (state.currentView === "data") {
          if (isHighlight) {
            const translatedLabel = window.i18n.t(link.label);
            this.drawEdgeLabel(geom.lx, geom.ly, translatedLabel, true);
          }
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
        rect.setAttribute("stroke-width", isSelected ? "2.5" : "1.5");

        // 標題 Text (第一行：節點名稱)
        const displayName = window.i18n.t(node.name);
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.setAttribute("x", "12");
        title.setAttribute("y", "26");
        title.setAttribute("fill", groupColor.text);
        title.setAttribute("font-size", state.lang === 'en' ? "13" : "14");
        title.setAttribute("font-weight", "800");
        title.textContent = displayName;

        // 次標題 Text (第二行：Type 系統/類型)
        // 嚴格依據主題獨立設定顏色：暗色模式亮青藍 #93c5fd，亮色模式深色 #334155
        const displayType = window.i18n.t(node.type || "");
        const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sub.setAttribute("x", "12");
        sub.setAttribute("y", "46");
        sub.setAttribute("fill", isLight ? "#334155" : "#93c5fd");
        sub.setAttribute("font-size", "10.5");
        sub.setAttribute("font-weight", "600");
        sub.textContent = displayType;

        // 摘要標籤 Text (第三行：Label 關鍵參數)
        // 嚴格依據主題獨立設定顏色：暗色模式高亮灰白 #e2e8f0，亮色模式深石板灰 #475569
        const displayLabel = window.i18n.t(node.label || "");
        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lbl.setAttribute("x", "12");
        lbl.setAttribute("y", "63");
        lbl.setAttribute("fill", isLight ? "#475569" : "#e2e8f0");
        lbl.setAttribute("font-size", "9.5");
        lbl.textContent = displayLabel.substring(0, 26) + (displayLabel.length > 26 ? "..." : "");

        g.appendChild(rect);
        g.appendChild(title);
        g.appendChild(sub);
        g.appendChild(lbl);

        this.nodesGroup.appendChild(g);
      });
    }

    drawEdgeLabel(x, y, textStr, isHighlight = false) {
      const targetLayer = this.labelsGroup || this.nodesGroup;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `edge-label-group ${isHighlight ? 'active-highlight' : ''}`);
      g.setAttribute("transform", `translate(${x}, ${y})`);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "0");
      text.setAttribute("y", "3.5");
      text.setAttribute("fill", isHighlight ? "var(--accent)" : "var(--text-main)");
      text.setAttribute("font-size", isHighlight ? "10.5" : "9.5");
      text.setAttribute("font-weight", isHighlight ? "800" : "600");
      text.setAttribute("text-anchor", "middle");
      text.textContent = textStr;

      const paddingX = 8;
      const widthEst = textStr.length * (isHighlight ? 8 : 7.2) + paddingX * 2;
      const heightEst = isHighlight ? 20 : 18;

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", -widthEst / 2);
      bg.setAttribute("y", -heightEst / 2);
      bg.setAttribute("width", widthEst);
      bg.setAttribute("height", heightEst);
      bg.setAttribute("rx", "9");
      bg.setAttribute("fill", isHighlight ? "var(--bg-card)" : "var(--bg-input)");
      bg.setAttribute("stroke", isHighlight ? "var(--accent)" : "var(--border)");
      bg.setAttribute("stroke-width", isHighlight ? "1.8" : "1");
      if (isHighlight) {
        bg.setAttribute("filter", "drop-shadow(0 0 6px var(--accent-glow))");
      }

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
