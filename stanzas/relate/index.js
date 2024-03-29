import Stanza from 'togostanza/stanza';

export default class Gfa extends Stanza {
  async render() {
    const self = this;
    self.renderTemplate(
      {
        template: 'stanza.html.hbs',
        parameters: {
          greeting: `Hello, ${self.params['say-to']}!`
        }
      }
    );

    // config
    const CONF = {
      padding: 10,
      sectionSize: {
        cluster: 0.5,
        mutation: 0.5,
      },
    };

    let ethnicitiesOfHaplotypes, haplotypes, mutations, trees, mutationsByHaplotype;
    const stageRect = (() => {
      const svgRect = self.root.querySelector("#svg").getBoundingClientRect();
      return {
        width: svgRect.width - CONF.padding * 2,
        height: svgRect.height - CONF.padding * 2,
      };
    })();

    // prepare svg
    (() => {
      const mutationGroup = self.root.querySelector("#mutations");
      mutationGroup.setAttributeNS(
        null,
        "transform",
        `translate(${CONF.padding}, ${CONF.sectionSize.cluster * stageRect.height + CONF.padding
        })`
      );
    })();

    parseData();
    self.root.querySelector('#parseDataButton').addEventListener('click', parseData);
    function parseData() {
      // ethnicity of these haplotypes
      ethnicitiesOfHaplotypes = getEthnicitiesOfHaplotypes();

      // haplotypes
      haplotypes = getHaplotypes();
      console.log(haplotypes);
      makeStyleSheet();

      // .mut
      mutations = getMutations();
      console.log(mutations);

      // .anc
      trees = getTrees();
      console.log(trees[0]);

      getMutationsByHaplotype();

      // set options in selector
      const select = self.root.querySelector("#trees");
      select.innerHTML = trees
        .map(
          (tree, index) =>
            `<option value="${index}">Tree${index + 1}: ${tree.region.start}-${tree.region.end
            }</option>`
        )
        .join("");

      // draw mutation
      drawMutations();
    }

    self.root.querySelector("#drawDendrogramButton").addEventListener("click", drawDendrogram);
    function drawDendrogram() {
      // select tree
      const treeIndex = parseInt(self.root.querySelector("#trees").value, 10);
      const tree = trees[treeIndex].branches;

      // get bottom branches
      const terminalBranches = [];
      const rootBranch = tree.find((branch) => branch.parentBranchId === -1);
      const getChildBranches = (branch) => {
        if (branch.children == null) {
          terminalBranches.push(branch);
        } else {
          for (let child of branch.children) {
            getChildBranches(child);
          }
        }
      };
      getChildBranches(rootBranch);

      // move label positions to branch positions
      window.requestAnimationFrame(() => {
        for (let i = 0; i < terminalBranches.length; i++) {
          const branch = terminalBranches[i];
          console.log(branch);
          const haplotype = haplotypes[branch.branchId];
          const branchLine = document.querySelector(
            `#dendrogram > line[data-branch-id="${branch.branchId}"]`
          );
          console.log(branchLine);
          const g = document.querySelector(
            `#mutations > g[data-index="${branchLine.dataset.branchId}"]`
          );
          console.log(g, +g.dataset.index);
          g.setAttribute(
            "transform",
            `translate(${+branchLine.dataset.index * minGap}, 0)`
          );
        }
      });

      // get over-all length
      let branch = tree[0];
      let overAllLength = branch.distance;
      while (true) {
        const parentBranch = tree.find(
          (parentBranch) => parentBranch.branchId === branch.parentBranchId
        );
        if (parentBranch == null) break;
        overAllLength += parentBranch.distance;
        branch = parentBranch;
      }

      // clear svg
      const svgDendrogram = self.root.querySelector("#dendrogram");
      while (svgDendrogram.firstChild) {
        svgDendrogram.removeChild(svgDendrogram.firstChild);
      }
      // draw
      const minGap = stageRect.width / haplotypes.length;
      const yRatio = (stageRect.height * CONF.sectionSize.cluster) / overAllLength;
      // branch whose parent branch is not drawn
      const drawnBranches = [];
      const existingSiblingBranches = [];

      // // draw label of haplotypes
      // for (let i = 0; i < haplotypes.length; i++) {
      //   const branch = terminalBranches[i];
      //   const haplotype = haplotypes[branch.branchId];
      //   const ethnic = ethnicitiesOfHaplotypes.find(
      //     (eoh) => eoh.sampleid === haplotype
      //   );
      //   const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      //   g.setAttribute(
      //     "transform",
      //     `translate(${minGap * (i - 1) + CONF.padding}, 0)`
      //   );
      //   svgMutationGroup.appendChild(g);
      //   const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      //   text.setAttribute("text-anchor", "start");
      //   text.setAttribute("dominant-baseline", "central");
      //   text.setAttribute("transform", "rotate(90)");
      //   text.classList.add("haplotype-label");
      //   text.textContent = `${haplotype}${
      //     ethnic ? ` (${ethnic.popname}/${ethnic.gpopname})` : ""
      //   }`;
      //   g.appendChild(text);
      // }

      // draw terminal branches
      for (let i = 0; i < terminalBranches.length; i++) {
        const branch = terminalBranches[i];
        const haplotype = haplotypes[branch.branchId];
        const ethnic = ethnicitiesOfHaplotypes.find(
          (eoh) => eoh.sampleid === haplotype
        );
        const x = minGap * i;
        const y = stageRect.height * CONF.sectionSize.cluster;
        const line = createLine(x, x, y, y - branch.distance * yRatio);
        line.setAttribute("data-index", i);
        line.setAttribute("data-branch-id", branch.branchId);
        line.setAttribute("data-parent-branch-id", branch.parentBranchId);
        ethnic ? line.setAttribute("data-ethnic", ethnic.popname) : "";
        line.ethnic = ethnic;
        svgDendrogram.appendChild(line);
        branch.line = line;
        const siblingBranch = drawnBranches.find(
          (drawnBranch) => drawnBranch.parentBranchId === branch.parentBranchId
        );
        if (siblingBranch) existingSiblingBranches.push(siblingBranch);
        drawnBranches.push(branch);
      }

      // draw other branches
      const undrawnBranches = [...tree];
      // remove terminal branches from undrawnBranches
      for (let terminalBranch of terminalBranches) {
        const index = undrawnBranches.findIndex(
          (branch) => branch.branchId === terminalBranch.branchId
        );
        undrawnBranches.splice(index, 1);
      }
      while (true) {
        const childBranches = [existingSiblingBranches.shift()];
        if (childBranches[0] == undefined) break;
        childBranches.push(
          drawnBranches.find(
            (branch) =>
              branch.parentBranchId === childBranches[0].parentBranchId &&
              branch.branchId !== childBranches[0].branchId
          )
        );
        const ethnic = (() =>
          childBranches[0].line.ethnic &&
            childBranches[0].line.ethnic.popname ===
            childBranches[1].line.ethnic?.popname
            ? childBranches[0].line.ethnic
            : undefined)();
        const branch = tree.find(
          (branch) => branch.branchId === childBranches[0].parentBranchId
        );
        // draw branch
        const x =
          (childBranches[0].line.x1.baseVal.value +
            childBranches[1].line.x1.baseVal.value) /
          2;
        const y = childBranches[0].line.y2.baseVal.value;
        const beam = createLine(
          childBranches[0].line.x1.baseVal.value,
          childBranches[1].line.x1.baseVal.value,
          childBranches[0].line.y2.baseVal.value,
          childBranches[1].line.y2.baseVal.value
        );
        ethnic !== undefined
          ? beam.setAttribute("data-ethnic", ethnic.popname)
          : "";
        svgDendrogram.appendChild(beam);
        const line = createLine(x, x, y, y - branch.distance * yRatio);
        line.dataset.branchId = branch.branchId;
        line.dataset.parentBranchId = branch.parentBranchId;
        ethnic !== undefined
          ? line.setAttribute("data-ethnic", ethnic.popname)
          : "";
        line.ethnic = ethnic;
        svgDendrogram.appendChild(line);
        branch.line = line;
        const siblingBranche = drawnBranches.find(
          (drawnBranche) => drawnBranche.parentBranchId === branch.parentBranchId
        );
        if (siblingBranche !== undefined)
          existingSiblingBranches.push(siblingBranche);
        drawnBranches.push(branch);
        // remove from undrawnBranches and existingSiblingBranches
        let index = drawnBranches.indexOf(childBranches[1]);
        drawnBranches.splice(index, 1);
      }

      // map mutation
      const mutationsOfThisTree = mutations.filter(
        (mutation) => mutation.treeIndex === treeIndex
      );
      for (let mutation of mutationsOfThisTree) {
        if (mutation.isNotMapping) continue;
        const branch = tree.find(
          (branch) => branch.branchId === mutation.branchIndices[0]
        );
        const x = branch.line.x1.baseVal.value;
        const y = (branch.line.y1.baseVal.value + branch.line.y2.baseVal.value) / 2;
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("fill", "red");
        svgDendrogram.appendChild(circle);
        circle.mutation = mutation;
        circle.addEventListener("mouseover", () => {
          console.log(mutation);
        });
      }
    }

    function getMutations() {
      const mutData = self.root.querySelector("#mutData").value.trim();
      const lines = mutData.split("\n").slice(1); // ヘッダー行を除外
      return lines.map((line) => {
        const parts = line.split(";").map((part) => part.trim());
        return {
          snp: parseInt(parts[0], 10),
          posOfSnp: parseInt(parts[1], 10),
          dist: parseInt(parts[2], 10),
          rsId: parts[3],
          treeIndex: parseInt(parts[4], 10),
          branchIndices: parts[5].split(" ").map((index) => parseInt(index, 10)),
          isNotMapping: parseInt(parts[6], 10),
          isFlipped: parseInt(parts[7], 10),
          ageBegin: parseFloat(parts[8]),
          ageEnd: parseFloat(parts[9]),
          alleles: parts[10].split("/"),
        };
      });
    }

    function getTrees() {
      const ancData = self.root.querySelector("#ancData").value.trim().split("\n");
      const treesRawData = ancData.slice(2);
      const startNumbers = treesRawData.map((tree) =>
        parseInt(tree.match(/^(\d+)/)[0])
      );
      const regions = startNumbers.map((start, index) => {
        return {
          start,
          end: startNumbers[index + 1]
            ? startNumbers[index + 1] - 1
            : mutations[mutations.length - 1].snp,
        };
      });
      return treesRawData.map((tree, index) => {
        const treeData = tree.match(/:\s*(.+)/)[1];
        const branches = treeData
          .split(") ")
          .filter((branch) => branch)
          .map((branch, index) => {
            // 末尾の閉じカッコを復元（分割で失われるため）
            branch = branch.trim().endsWith(")") ? branch : branch + ")";
            const branchParts = branch.match(
              /(-?\d+)\:\(([\d\.]+) ([\d\.]+) (-?\d+) (-?\d+)\)/
            );
            return {
              branchId: index,
              parentBranchId: parseInt(branchParts[1], 10),
              distance: parseFloat(branchParts[2]),
              weight: parseFloat(branchParts[3]),
              branchFrom: parseInt(branchParts[4], 10),
              branchTo: parseInt(branchParts[5], 10),
            };
          });
        for (let branch of branches) {
          const children = branches.filter(
            (child) => child.parentBranchId === branch.branchId
          );
          if (children.length > 0) {
            branch.children = children;
          }
        }
        return { branches, region: regions[index] };
      });
    }

    function getMutationsByHaplotype() {
      const findChildren = (branchId, treeIndex, mutatedBranches) => {
        mutatedBranches.push(branchId);
        const branches = trees[treeIndex].branches.filter(
          (branch) => branch.parentBranchId === branchId
        );
        if (branches.length !== 0) {
          for (let branch of branches) {
            findChildren(branch.branchId, treeIndex, mutatedBranches);
          }
        }
      };

      mutationsByHaplotype = new Array(haplotypes.length)
        .fill(null)
        .map(() => new Array(mutations.length).fill(0));
      for (let i = 0; i < mutations.length; i++) {
        const { treeIndex, branchIndices } = mutations[i];
        const mutatedBranches = [];
        for (let branchId of branchIndices) {
          findChildren(branchId, treeIndex, mutatedBranches);
        }
        for (let i2 = 0; i2 < mutatedBranches.length; i2++) {
          if (mutationsByHaplotype[mutatedBranches[i2]])
            mutationsByHaplotype[mutatedBranches[i2]][i] = 1;
        }
      }
    }

    function createLine(x1, x2, y1, y2) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "black");
      line.setAttribute("stroke-width", 1);
      return line;
    }

    function getEthnicitiesOfHaplotypes() {
      const ethData = self.root.querySelector("#ethData").value.trim();
      return ethData.split("\n").map((eth) => {
        const [sampleid, popname, gpopname] = eth.split("\t");
        return { sampleid, popname, gpopname };
      });
    }

    function getHaplotypes() {
      const hapData = self.root.querySelector("#hapData").value.trim();
      return hapData.split("\n").map((hap) => hap.split(".")[0]);
    }

    function makeStyleSheet() {
      // existing ethnicities
      const existingEthnicities = (() => {
        let e = haplotypes.reduce((acc, hap) => {
          const eoh = ethnicitiesOfHaplotypes.find((eoh) => eoh.sampleid === hap);
          eoh ? acc.push(eoh.popname) : null;
          return acc;
        }, []);
        return Array.from(new Set(e));
      })();
      // make stylesheet
      const ethnicColors = Object.fromEntries(
        existingEthnicities.map((eth, index) => [
          eth,
          `hsl(${(index * 360) / existingEthnicities.length}, 50%, 50%)`,
        ])
      );
      const style = document.createElement("style");
      document.head.appendChild(style);
      let styleSheet = style.sheet;
      for (let eth in ethnicColors) {
        styleSheet.insertRule(`[data-ethnic="${eth}"] {
      fill: ${ethnicColors[eth]};
      stroke: ${ethnicColors[eth]};
    }`);
      }
    }

    function drawMutations() {
      const svgMutationGroup = self.root.querySelector("#mutations");
      const minGap = stageRect.width / haplotypes.length;
      const yRatio =
        (stageRect.height * CONF.sectionSize.mutation) / mutations.length;

      // draw
      for (let i = 0; i < haplotypes.length; i++) {
        const haplotype = haplotypes[i];
        const ethnic = ethnicitiesOfHaplotypes.find(
          (eoh) => eoh.sampleid === haplotype
        );
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${minGap * (i - 1)}, 0)`);
        g.setAttribute("data-haplotype", haplotype);
        g.setAttribute("data-index", i);
        svgMutationGroup.appendChild(g);
        // draw mutations
        for (let j = 0; j < mutations.length; j++) {
          if (mutationsByHaplotype[i][j] === 1) {
            const x = minGap * i;
            const y = j * yRatio;
            const rect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            // rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", minGap);
            rect.setAttribute("height", yRatio);
            rect.setAttribute("data-haplotype", haplotype);
            rect.setAttribute("data-mutation", mutations[j].snp);
            rect.setAttribute("data-position", j);
            ethnic ? rect.setAttribute("data-ethnic", ethnic.popname) : "";
            g.appendChild(rect);
          }
        }
        // draw label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "start");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("transform", "rotate(90)");
        text.setAttribute("y", -minGap / 2);
        text.classList.add("haplotype-label");
        text.textContent = `${haplotype}${ethnic ? ` (${ethnic.popname}/${ethnic.gpopname})` : ""
          }`;
        g.appendChild(text);
      }
    }


  }
}
