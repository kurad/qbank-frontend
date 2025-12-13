<template>
  <!-- Utility component: no UI -->
  <div style="display: none" />
</template>

<script>
import html2pdf from "html2pdf.js";
import katex from "katex";
import "katex/dist/katex.min.css";
import axios from "axios";

export default {
  name: "StandardAssessmentPdfGenerator",
  methods: {
    storageUrl(path) {
      if (!path) return "";
      const p = String(path);
      if (/^https?:\/\//i.test(p)) return p;
      let base = axios.defaults.baseURL || "";
      base = base.replace(/\/$/, "");
      base = base.replace(/\/api$/i, "");
      const rel = p.replace(/^\/?storage\//i, "").replace(/^\//, "");
      return `${base}/storage/${rel}`;
    },
    escapeHtml(s) {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },
    cleanMath(text) {
      if (!text) return "";
      if (text.startsWith("$") && text.endsWith("$")) {
        return text.slice(1, -1).trim();
      }
      return text;
    },
    renderInlineMath(text) {
      try {
        return katex.renderToString(text, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (_) {
        return text;
      }
    },
    renderBlockMath(text) {
      try {
        return katex.renderToString(text, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (_) {
        return text;
      }
    },
    renderWithInlineMath(raw, { allowBlock = true } = {}) {
      if (!raw) return "";
      const str = String(raw);
      const trimmed = str.trim();
      if (allowBlock && trimmed.startsWith("$") && trimmed.endsWith("$")) {
        return this.renderBlockMath(this.cleanMath(trimmed));
      }
      const parts = [];
      const regex = /\$(.+?)\$/g;
      let lastIndex = 0;
      let m;
      while ((m = regex.exec(str)) !== null) {
        if (m.index > lastIndex) {
          parts.push(this.escapeHtml(str.slice(lastIndex, m.index)));
        }
        parts.push(this.renderInlineMath(m[1]));
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < str.length) {
        parts.push(this.escapeHtml(str.slice(lastIndex)));
      }
      return parts.join("");
    },
    looksLikeTex(str) {
      if (!str) return false;
      const s = String(str);
      if (s.includes("$")) return false;
      return /(\\[a-zA-Z]+|\\frac|\\sqrt|\\left|\\right|\\times|\\div|\\cdot|\\lambda|\\pi|\\theta|\\le|\\ge|\\neq|\\infty|\^|_)/.test(
        s
      );
    },
    renderSmartMath(raw, { allowBlock = true } = {}) {
      if (!raw) return "";
      const s = String(raw);
      if (s.includes("$")) return this.renderWithInlineMath(s, { allowBlock });
      if (this.looksLikeTex(s)) return this.renderInlineMath(s);
      return this.escapeHtml(s);
    },

    // Main entry: sections-based PDF
    // sections: [{ id, ordering, title, instruction, questions: [...] }]
    generatePdf(assessment, sections, isTeacher = false) {
      const a = assessment || {};
      const secs = Array.isArray(sections) ? sections : [];
      const allQuestions = secs.flatMap((s) =>
        Array.isArray(s.questions) ? s.questions : []
      );

      const pdfContent = document.createElement("div");
      pdfContent.style.minHeight = "100vh";
      pdfContent.style.background =
        "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)";
      pdfContent.style.padding = "0";
      pdfContent.style.fontFamily =
        "'Segoe UI', 'Roboto', Arial, sans-serif, serif";
      pdfContent.style.color = "#222";
      pdfContent.style.fontSize = "11pt";
      pdfContent.style.lineHeight = "1.5";

      const card = document.createElement("div");
      card.style.background = "#fff";
      card.style.borderRadius = "18px";
      card.style.boxShadow = "0 4px 24px 0 rgba(60,72,88,0.10)";
      card.style.margin = "10px auto 60px auto";
      card.style.maxWidth = "800px";
      card.style.padding = "12px 30px 8px 30px";
      card.style.position = "relative";
      card.style.overflow = "hidden";

      let schoolLogoHtml = "";
      let logoUrl = "";
      if (a.creator?.school?.logo_path) {
        logoUrl = this.storageUrl(a.creator.school.logo_path);
      } else if (a.school?.logo_path) {
        logoUrl = this.storageUrl(a.school.logo_path);
      } else if (a.logo_path) {
        logoUrl = this.storageUrl(a.logo_path);
      }
      if (logoUrl) {
        schoolLogoHtml = `<img src="${logoUrl}" crossOrigin="anonymous" style="max-height: 80px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />`;
      }

      const firstTopic = a.topics || "";
      const subjectName =
        firstTopic?.grade_subject?.subject?.name ||
        a.subject?.name ||
        a.subject ||
        "";
      const gradeLevel =
        firstTopic?.grade_subject?.grade_level?.grade_name ||
        a.grade_level ||
        "";

      const header = document.createElement("div");
      header.style.background = "#e0e7ef";
      header.style.color = "#222";
      header.style.borderRadius = "14px 14px 0 0";
      header.style.padding = "20px 20px 12px 20px";
      header.style.textAlign = "center";
      header.style.marginBottom = "12px";
      header.style.position = "relative";

      if (schoolLogoHtml) {
        const logoDiv = document.createElement("div");
        logoDiv.innerHTML = schoolLogoHtml;
        logoDiv.style.marginBottom = "8px";
        logoDiv.style.display = "flex";
        logoDiv.style.justifyContent = "center";
        header.appendChild(logoDiv);
      }

      const schoolNameH1 = document.createElement("h1");
      schoolNameH1.textContent = a.creator?.school?.school_name || "School Name";
      schoolNameH1.style.fontSize = "1.8rem";
      schoolNameH1.style.fontWeight = "700";
      schoolNameH1.style.margin = "0 0 2px 0";
      schoolNameH1.style.letterSpacing = "0.5px";
      header.appendChild(schoolNameH1);

      const metaDiv = document.createElement("div");
      metaDiv.style.textAlign = "left";
      metaDiv.style.marginTop = "18px";
      metaDiv.innerHTML = `
        <h2 style="font-size: 1.3rem; color: black; font-weight: 600; margin-bottom: 2px;">${this.escapeHtml(
          a.title || ""
        )}</h2>
        <p style="font-size: 1.1rem; margin: 0; color: #e0e7ef;">Subject: ${this.escapeHtml(
          subjectName
        )}${
        gradeLevel
          ? ` | Grade: ${this.escapeHtml(gradeLevel)}`
          : ""
      }</p>
      `;
      header.appendChild(metaDiv);
      card.appendChild(header);

      if (!isTeacher) {
        const infoBox = document.createElement("div");
        infoBox.style.background = "#f7f7f7";
        infoBox.style.border = "1px solid #e5e7eb";
        infoBox.style.borderRadius = "8px";
        infoBox.style.padding = "8px 12px";
        infoBox.style.margin = "4px 0 8px 0";
        infoBox.style.pageBreakInside = "avoid";
        infoBox.style.breakInside = "avoid";

        const line = (label) => {
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.gap = "10px";
          row.style.margin = "4px 0";
          const lab = document.createElement("strong");
          lab.textContent = `${label}:`;
          lab.style.minWidth = "120px";
          const underline = document.createElement("div");
          underline.style.flex = "1";
          underline.style.borderBottom = "2px solid #1f2937";
          underline.style.height = "0";
          row.appendChild(lab);
          row.appendChild(underline);
          return row;
        };

        infoBox.appendChild(line("Student Name"));
        infoBox.appendChild(line("Class/Grade"));
        card.appendChild(infoBox);
      }

      const mainContent = document.createElement("div");
      mainContent.style.padding = "4px 0 0 0";
      mainContent.style.paddingBottom = "60px";
      mainContent.style.wordBreak = "normal";
      mainContent.style.overflowWrap = "break-word";
      mainContent.style.hyphens = "none";

      const totalMarks = allQuestions.reduce(
        (sum, q) => sum + (parseFloat(q.marks || 0) || 0),
        0
      );

      const instructions = document.createElement("div");
      instructions.style.background = "#f3f4f6";
      instructions.style.borderLeft = "6px solid #374151";
      instructions.style.borderRadius = "6px";
      instructions.style.padding = "8px 12px";
      instructions.style.margin = "0 0 10px 0";
      instructions.style.pageBreakInside = "avoid";
      instructions.style.breakInside = "avoid";

      const instTitle = document.createElement("div");
      instTitle.style.fontWeight = "bold";
      instTitle.style.marginBottom = "6px";
      instTitle.textContent = "Instructions:";
      instructions.appendChild(instTitle);

      const ulInst = document.createElement("ul");
      ulInst.style.margin = "0";
      ulInst.style.paddingLeft = "20px";
      [
        "Answer all questions in the spaces provided.",
        "For multiple choice questions, circle or tick the correct answer.",
        "Show all working where necessary.",
      ].forEach((b) => {
        const li = document.createElement("li");
        li.style.margin = "2px 0";
        li.textContent = b;
        ulInst.appendChild(li);
      });
      instructions.appendChild(ulInst);
      card.appendChild(instructions);

      // Sections and questions
      secs
        .slice()
        .sort((aSec, bSec) => (aSec.ordering || 0) - (bSec.ordering || 0))
        .forEach((sec) => {
          const sectionDiv = document.createElement("div");
          sectionDiv.style.marginBottom = "24px";

          const secHeader = document.createElement("h2");
          secHeader.style.fontSize = "1.2rem";
          secHeader.style.marginBottom = "10px";
          secHeader.style.color = "#111827";
          secHeader.style.background = "#e5e7eb";
          secHeader.style.borderRadius = "4px";
          secHeader.style.padding = "6px 10px";
          secHeader.style.display = "inline-block";

          secHeader.textContent = sec.title || "";
          sectionDiv.appendChild(secHeader);

          if (sec.instruction) {
            const secInst = document.createElement("div");
            secInst.style.fontSize = "0.95rem";
            secInst.style.marginBottom = "10px";
            secInst.style.color = "#4b5563";
            secInst.textContent = sec.instruction;
            sectionDiv.appendChild(secInst);
          }

          const questions = Array.isArray(sec.questions) ? sec.questions : [];
          questions.forEach((q, idx) => {
            const questionDiv = document.createElement("div");
            questionDiv.style.marginBottom = "14px";

            const qHeader = document.createElement("h3");
            qHeader.style.fontSize = "1.05rem";
            qHeader.style.marginBottom = "8px";
            qHeader.style.borderBottom = "1px solid #e0e7ef";
            qHeader.style.paddingBottom = "4px";
            qHeader.style.color = "#4f46e5";

            let headerMarks = parseFloat(q.marks || 0) || 0;
            if (Array.isArray(q.sub_questions) && q.sub_questions.length) {
              headerMarks = q.sub_questions.reduce(
                (sum, sub) => sum + (parseFloat(sub.marks || 0) || 0),
                0
              );
            }

            qHeader.innerHTML = `Question ${idx + 1} <span style=\"color: #000000; float: right; font-weight: 700;\">[marks: ${
              headerMarks
            }]<\/span>`;
            questionDiv.appendChild(qHeader);

            const qText = document.createElement("div");
            qText.style.marginBottom = "10px";
            qText.style.fontSize = "0.95rem";
            qText.style.pageBreakInside = "avoid";
            qText.style.breakInside = "avoid";
            qText.style.wordBreak = "normal";
            qText.style.overflowWrap = "break-word";
            qText.style.hyphens = "none";
            const qTextHtml = q.is_math
              ? this.renderSmartMath(q.question_text, { allowBlock: true })
              : this.escapeHtml(q.question_text);
            qText.innerHTML = qTextHtml;
            questionDiv.appendChild(qText);

            if (q.question_image) {
              const img = document.createElement("img");
              img.src = this.storageUrl(q.question_image);
              img.crossOrigin = "anonymous";
              img.style.maxWidth = "500px";
              img.style.maxHeight = "300px";
              img.style.display = "block";
              img.style.margin = "10px auto 10px auto";
              img.style.borderRadius = "8px";
              img.style.boxShadow = "0 2px 8px 0 rgba(60,72,88,0.10)";
              img.style.pageBreakInside = "avoid";
              img.style.breakInside = "avoid";
              questionDiv.appendChild(img);
            }

            // Sub-questions (for parent/container questions)
            if (Array.isArray(q.sub_questions) && q.sub_questions.length) {
              const subWrap = document.createElement("div");
              subWrap.style.margin = "4px 0 0 10px";
              subWrap.style.paddingLeft = "8px";
              subWrap.style.borderLeft = "3px solid #e5e7eb";
              subWrap.style.pageBreakInside = "avoid";
              subWrap.style.breakInside = "avoid";

              // const titleSub = document.createElement("div");
              // titleSub.textContent = "Sub-questions:";
              // titleSub.style.fontWeight = "600";
              // titleSub.style.marginBottom = "4px";
              // titleSub.style.color = "#374151";
              // subWrap.appendChild(titleSub);

              const listSub = document.createElement("ol");
              listSub.style.margin = "0 0 4px 12px";
              listSub.style.padding = "0";
              q.sub_questions.forEach((sub, sIdx) => {
                const liSub = document.createElement("li");
                liSub.style.marginBottom = "3px";
                liSub.style.pageBreakInside = "avoid";
                liSub.style.breakInside = "avoid";

                const textDivSub = document.createElement("div");
                const subText = sub.is_math
                  ? this.renderSmartMath(sub.question, { allowBlock: true })
                  : this.escapeHtml(sub.question || "");
                const subMarks = parseFloat(sub.marks || 0) || 0;
                const marksSpanSub = `<span style=\"font-size:0.9rem; color:#6b7280; margin-left:6px;\">[Marks: ${subMarks}]<\/span>`;
                textDivSub.innerHTML = `${subText} ${marksSpanSub}`;
                liSub.appendChild(textDivSub);

                const subType = String(sub.question_type || "").toLowerCase();
                if (subType === "short_answer") {
                  if (isTeacher) {
                    // Teacher PDF: show answer if available, otherwise note and small space
                    const ansWrap = document.createElement("div");
                    ansWrap.style.marginTop = "4px";
                    ansWrap.style.pageBreakInside = "avoid";
                    ansWrap.style.breakInside = "avoid";

                    const hasAnswer =
                      sub.correct_answer != null &&
                      String(sub.correct_answer).trim() !== "";
                    if (hasAnswer) {
                      const titleAns = document.createElement("span");
                      titleAns.style.fontWeight = "bold";
                      titleAns.style.color = "#4f46e5";
                      titleAns.textContent = "Answer: ";
                      ansWrap.appendChild(titleAns);

                      const ansText = document.createElement("span");
                      const txtAns = String(sub.correct_answer);
                      ansText.innerHTML = sub.is_math
                        ? this.renderSmartMath(txtAns, { allowBlock: true })
                        : this.escapeHtml(txtAns);
                      ansWrap.appendChild(ansText);
                    } else {
                      const note = document.createElement("div");
                      note.style.fontStyle = "italic";
                      note.style.color = "#6b7280";
                      note.textContent = "No answer was provided.";
                      ansWrap.appendChild(note);

                      const lines = document.createElement("div");
                      lines.style.margin = "4px 4px 0 0";
                      lines.style.pageBreakInside = "avoid";
                      lines.style.breakInside = "avoid";
                      for (let i = 0; i < 2; i++) {
                        const lineDiv = document.createElement("div");
                        lineDiv.style.borderBottom = "1px solid #333";
                        lineDiv.style.height = "16px";
                        lineDiv.style.marginBottom = "4px";
                        lineDiv.style.pageBreakInside = "avoid";
                        lineDiv.style.breakInside = "avoid";
                        lines.appendChild(lineDiv);
                      }
                      ansWrap.appendChild(lines);
                    }

                    liSub.appendChild(ansWrap);
                  } else {
                    // Student PDF: leave writing space only
                    const lines = document.createElement("div");
                    lines.style.margin = "6px 4px 0 0";
                    lines.style.pageBreakInside = "avoid";
                    lines.style.breakInside = "avoid";
                    for (let i = 0; i < 3; i++) {
                      const lineDiv = document.createElement("div");
                      lineDiv.style.borderBottom = "1px solid #333";
                      lineDiv.style.height = "18px";
                      lineDiv.style.marginBottom = "6px";
                      lineDiv.style.pageBreakInside = "avoid";
                      lineDiv.style.breakInside = "avoid";
                      lines.appendChild(lineDiv);
                    }
                    liSub.appendChild(lines);
                  }
                }

                listSub.appendChild(liSub);
              });
              subWrap.appendChild(listSub);
              questionDiv.appendChild(subWrap);
            }

            const qType = String(q.question_type || "").toLowerCase();
            if (qType === "matching") {
              const leftArr = (q.matching_items && q.matching_items.left) || [];
              const rightArr = (q.matching_items && q.matching_items.right) || [];
              const maxLen = Math.max(leftArr.length, rightArr.length);

              const table = document.createElement("table");
              table.style.width = "100%";
              table.style.borderCollapse = "collapse";
              table.style.marginTop = "6px";
              table.style.marginLeft = "10px";
              table.style.pageBreakInside = "avoid";
              table.style.breakInside = "avoid";

              const thead = document.createElement("thead");
              const headRow = document.createElement("tr");
              ["Left", "Right"].forEach((label) => {
                const th = document.createElement("th");
                th.textContent = label;
                th.style.borderBottom = "1px solid #e5e7eb";
                th.style.padding = "4px 6px";
                th.style.textAlign = "left";
                th.style.color = "#4f46e5";
                th.style.fontWeight = "600";
                headRow.appendChild(th);
              });
              thead.appendChild(headRow);
              table.appendChild(thead);

              const tbody = document.createElement("tbody");
              for (let i = 0; i < maxLen; i++) {
                const row = document.createElement("tr");
                const leftCell = document.createElement("td");
                const rightCell = document.createElement("td");

                const leftText = leftArr[i] ?? "";
                const rightText = rightArr[i] ?? "";

                leftCell.style.padding = "3px 6px";
                rightCell.style.padding = "3px 6px";
                leftCell.style.borderBottom = "1px solid #f3f4f6";
                rightCell.style.borderBottom = "1px solid #f3f4f6";

                leftCell.innerHTML = q.is_math
                  ? this.renderSmartMath(leftText || `Item ${i + 1}`, { allowBlock: false })
                  : this.escapeHtml(leftText || `Item ${i + 1}`);

                rightCell.innerHTML = q.is_math
                  ? this.renderSmartMath(rightText || `Item ${i + 1}`, { allowBlock: false })
                  : this.escapeHtml(rightText || `Item ${i + 1}`);

                row.appendChild(leftCell);
                row.appendChild(rightCell);
                tbody.appendChild(row);
              }

              table.appendChild(tbody);
              questionDiv.appendChild(table);

              if (
                isTeacher &&
                Array.isArray(q.matching_pairs) &&
                q.matching_pairs.length
              ) {
                const pairsDiv = document.createElement("div");
                pairsDiv.style.marginTop = "8px";
                pairsDiv.style.pageBreakInside = "avoid";
                pairsDiv.style.breakInside = "avoid";
                const titlePairs = document.createElement("div");
                titlePairs.style.fontWeight = "bold";
                titlePairs.style.color = "#4f46e5";
                titlePairs.textContent = "Correct Pairs:";
                pairsDiv.appendChild(titlePairs);
                const ulPairs = document.createElement("ul");
                ulPairs.style.margin = "4px 0 0 18px";
                ulPairs.style.pageBreakInside = "avoid";
                ulPairs.style.breakInside = "avoid";
                q.matching_pairs.forEach((p) => {
                  const li = document.createElement("li");
                  li.style.pageBreakInside = "avoid";
                  li.style.breakInside = "avoid";
                  const leftTxt =
                    q.matching_items?.left?.[p.left_index] ??
                    `Left ${p.left_index + 1}`;
                  const rightTxt =
                    q.matching_items?.right?.[p.right_index] ??
                    `Right ${p.right_index + 1}`;
                  li.textContent = `${leftTxt} → ${rightTxt}`;
                  ulPairs.appendChild(li);
                });
                pairsDiv.appendChild(ulPairs);
                questionDiv.appendChild(pairsDiv);
              }
            } else if (qType === "short_answer") {
              if (isTeacher) {
                const ansWrap = document.createElement("div");
                ansWrap.style.marginLeft = "10px";
                ansWrap.style.marginTop = "6px";
                ansWrap.style.pageBreakInside = "avoid";
                ansWrap.style.breakInside = "avoid";
                const titleAns = document.createElement("div");
                titleAns.style.fontWeight = "bold";
                titleAns.style.color = "#4f46e5";
                titleAns.textContent = "Answer:";
                ansWrap.appendChild(titleAns);
                const ans = document.createElement("div");
                ans.style.pageBreakInside = "avoid";
                ans.style.breakInside = "avoid";
                const txtAns = String(q.correct_answer ?? "");
                ans.innerHTML = q.is_math
                  ? this.renderSmartMath(txtAns, { allowBlock: true })
                  : this.escapeHtml(txtAns);
                ansWrap.appendChild(ans);
                questionDiv.appendChild(ansWrap);
              } else {
                const lines = document.createElement("div");
                lines.style.margin = "8px 10px 0 10px";
                lines.style.pageBreakInside = "avoid";
                lines.style.breakInside = "avoid";
                for (let i = 0; i < 5; i++) {
                  const lineDiv = document.createElement("div");
                  lineDiv.style.borderBottom = "1px solid #333";
                  lineDiv.style.height = "22px";
                  lineDiv.style.marginBottom = "10px";
                  lineDiv.style.pageBreakInside = "avoid";
                  lineDiv.style.breakInside = "avoid";
                  lines.appendChild(lineDiv);
                }
                questionDiv.appendChild(lines);
              }
            } else if (qType === "true_false") {
              const correct = String(q.correct_answer || "").toLowerCase();
              const tf = ["true", "false"];
              const optsWrap = document.createElement("div");
              optsWrap.style.display = "flex";
              optsWrap.style.flexWrap = "wrap";
              optsWrap.style.gap = "12px 24px";
              optsWrap.style.margin = "6px 0 0 10px";
              optsWrap.style.pageBreakInside = "avoid";
              optsWrap.style.breakInside = "avoid";
              tf.forEach((labelTF, idxTF) => {
                const isCorrect = labelTF === correct;
                const optDiv = document.createElement("div");
                optDiv.style.flex = "1 1 45%";
                optDiv.style.minWidth = "260px";
                optDiv.style.pageBreakInside = "avoid";
                optDiv.style.breakInside = "avoid";
                optDiv.style.margin = "0";
                optDiv.style.padding = "4px 6px";
                optDiv.style.border = "1px solid #e5e7eb";
                optDiv.style.borderRadius = "6px";
                optDiv.style.background = "#fff";
                optDiv.style.wordBreak = "normal";
                optDiv.style.overflowWrap = "break-word";
                optDiv.style.hyphens = "none";
                optDiv.innerHTML = `<strong style=\"color:#4f46e5\">${String.fromCharCode(
                  65 + idxTF
                )}.</strong> ${
                  labelTF.charAt(0).toUpperCase() + labelTF.slice(1)
                } ${
                  isTeacher && isCorrect
                    ? '<span style=\"color:green; font-weight: bold;\">(✔)</span>'
                    : ""
                }`;
                optsWrap.appendChild(optDiv);
              });
              questionDiv.appendChild(optsWrap);
            } else {
              // MCQ and other option-based questions (non-matching/short/true_false)
              const rawOptions = q.options || [];
              const texts = rawOptions.map((opt) => opt && opt.option_text
                ? String(opt.option_text)
                : "");
              const longest = texts.length
                ? Math.max(...texts.map((t) => t.length))
                : 0;
              // Heuristic: if the longest option is very long, use a single column
              const useSingleColumn = longest > 90;

              const optsWrap = document.createElement("div");
              optsWrap.style.display = "flex";
              optsWrap.style.flexWrap = "wrap";
              optsWrap.style.gap = useSingleColumn ? "6px" : "12px 24px";
              optsWrap.style.margin = "6px 0 0 10px";
              optsWrap.style.pageBreakInside = "avoid";
              optsWrap.style.breakInside = "avoid";

              rawOptions.forEach((opt, oidx) => {
                const optDiv = document.createElement("div");
                if (useSingleColumn) {
                  optDiv.style.flex = "1 1 100%";
                  optDiv.style.minWidth = "100%";
                } else {
                  optDiv.style.flex = "1 1 45%";
                  optDiv.style.minWidth = "260px";
                }
                optDiv.style.pageBreakInside = "avoid";
                optDiv.style.breakInside = "avoid";
                optDiv.style.margin = "0";
                optDiv.style.padding = "4px 6px";
                optDiv.style.border = "1px solid #e5e7eb";
                optDiv.style.borderRadius = "6px";
                optDiv.style.background = "#fff";
                optDiv.style.wordBreak = "normal";
                optDiv.style.overflowWrap = "break-word";
                optDiv.style.hyphens = "none";

                const textHtml = q.is_math
                  ? this.renderSmartMath(opt.option_text, { allowBlock: false })
                  : this.escapeHtml(opt.option_text);
                const correctMark = isTeacher && opt.is_correct
                  ? '<span style=\"color:green; font-weight: bold;\">(✔)</span>'
                  : "";

                optDiv.innerHTML = `<strong style=\"color:#4f46e5\">${String.fromCharCode(
                  65 + oidx
                )}.</strong> ${textHtml} ${correctMark}`;

                if (opt.option_image) {
                  const imgOpt = document.createElement("img");
                  imgOpt.src = this.storageUrl(opt.option_image);
                  imgOpt.style.maxWidth = useSingleColumn ? "320px" : "260px";
                  imgOpt.style.maxHeight = "140px";
                  imgOpt.style.display = "block";
                  imgOpt.style.marginTop = "6px";
                  imgOpt.style.borderRadius = "6px";
                  imgOpt.style.pageBreakInside = "avoid";
                  imgOpt.style.breakInside = "avoid";
                  optDiv.appendChild(imgOpt);
                }

                optsWrap.appendChild(optDiv);
              });
              questionDiv.appendChild(optsWrap);
            }

            sectionDiv.appendChild(questionDiv);
          });

          mainContent.appendChild(sectionDiv);
        });

      card.appendChild(mainContent);
      pdfContent.appendChild(card);

      return html2pdf()
        .set({
          margin: [18, 12, 30, 12],
          filename: `${isTeacher ? "teacher" : "student"}-${(a.title ||
            "assessment-sections")
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: {
            mode: ["css", "legacy"],
            avoid: [".avoid-page-break"]
          },
        })
        .from(pdfContent)
        .toPdf()
        .get("pdf")
        .then(function (pdf) {
          const pageCount = pdf.internal.getNumberOfPages();
          const schoolName =
            a.creator?.school?.school_name || a.school?.school_name || "School";
          const subj =
            (Array.isArray(a.topics)
              ? a.topics[0]?.grade_subject?.subject?.name
              : a.subject?.name) ||
            a.subject ||
            "Subject";
          const dateStr = new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const footerText = `${schoolName} | ${subj} - Question Paper  | ${dateStr}`;
          pdf.setFontSize(10);
          pdf.setTextColor(180, 180, 180);
          for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.text(footerText, 105, 280, { align: "center" });
          }
        })
        .save();
    },
  },
};
</script>

<style scoped>
/* No UI */
</style>
