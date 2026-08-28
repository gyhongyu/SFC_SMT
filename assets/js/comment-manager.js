// [ANCHOR: JS-COMMENT-MANAGER]
(function() {
  class CommentManager {
    static createComment({ nodeId, nodeName, targetField, originalContent, proposedChange, reviewer }) {
      return {
        commentId: `COM-${new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14)}`,
        nodeId: nodeId,
        nodeName: nodeName,
        targetField: targetField,
        originalContent: originalContent || "",
        proposedChange: proposedChange,
        reviewer: reviewer || "HQ_SFC_Team",
        status: "Pending_AI",
        timestamp: new Date().toISOString(),
        aiCommitLog: ""
      };
    }

    static exportDatabase(nodes, comments) {
      const payload = {
        exportedAt: new Date().toISOString(),
        workspace: "SSSTC_08_SFC_SMT",
        nodes: nodes,
        reviewComments: comments
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SFC_SMT_Schema_HQ_Reviewed_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  window.CommentManager = CommentManager;
})();
