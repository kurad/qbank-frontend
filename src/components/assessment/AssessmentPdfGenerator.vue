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
  name: "AssessmentPdfGenerator",
  methods: {
    storageUrl(path) {
      if (!path) return "";
      const p = String(path);
      if (/^https?:\/\//i.test(p)) return p; // already absolute
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
    // Render strings that may contain inline $...$ math while preserving normal text spacing
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
    // Heuristic: detect TeX-like content even without $...$
    looksLikeTex(str) {
      if (!str) return false;
      const s = String(str);
      if (s.includes("$")) return false; // handled elsewhere
      // common TeX commands and symbols
      return /(\\[a-zA-Z]+|\\frac|\\sqrt|\\left|\\right|\\times|\\div|\\cdot|\\lambda|\\pi|\\theta|\\le|\\ge|\\neq|\\infty|\^|_)/.test(
        s
      );
    },
    // Smart renderer: prefers inline-math segments, falls back to rendering whole as TeX if it looks like TeX
    renderSmartMath(raw, { allowBlock = true } = {}) {
      if (!raw) return "";
      const s = String(raw);
      if (s.includes("$")) return this.renderWithInlineMath(s, { allowBlock });
      if (this.looksLikeTex(s)) return this.renderInlineMath(s);
      return this.escapeHtml(s);
    },

    generatePdf(assessment, questions, isTeacher = true) {
      // Defensive defaults
      const a = assessment || {};
      const qs = Array.isArray(questions) ? questions : [];

  // Outer background
  const pdfContent = document.createElement("div");
  pdfContent.style.minHeight = "100vh";
  pdfContent.style.background = "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)";
  pdfContent.style.padding = "0";
  pdfContent.style.fontFamily = "'Segoe UI', 'Roboto', Arial, sans-serif, serif";
  pdfContent.style.color = "#222";
  pdfContent.style.fontSize = "12pt";
  pdfContent.style.lineHeight = "1.6";

  // Card container
  const card = document.createElement("div");
  card.style.background = "#fff";
  card.style.borderRadius = "18px";
  card.style.boxShadow = "0 4px 24px 0 rgba(60,72,88,0.10)";
  card.style.margin = "20px auto 20px auto"; // more top and bottom margin
  card.style.maxWidth = "800px";
  card.style.padding = "20px 36px 10px 36px"; // increased top and bottom padding
  card.style.position = "relative";
  card.style.overflow = "hidden";

      // Resolve school logo from creator.school first, then assessment.school, then assessment root
      let schoolLogoHtml = "";
      const creatorSchool = a.creator?.school || {};
      const assessSchool = a.school || {};
      let logoUrl = "";

    card.style.margin = "20px auto 80px auto"; // more bottom margin for footer

      if (a.creator?.school?.logo_path) {
        logoUrl = this.storageUrl(a.creator.school.logo_path);
      } else if (a.creator?.school?.logo_path) {
        logoUrl = this.storageUrl(a.creator.school.logo_path);
      } else if (a.school?.logo_path) {
        logoUrl = this.storageUrl(a.school.logo_path);
      } else if (a.school?.logo_path) {
        logoUrl = this.storageUrl(a.school.logo_path);
      } else if (a.logo_path) {
        logoUrl = this.storageUrl(a.logo_path);
      } else if (a.logo_path) {
        logoUrl = this.storageUrl(a.logo_path);
      }

      if (logoUrl) {
        schoolLogoHtml = `<img src="${logoUrl}" crossOrigin="anonymous" style="max-height: 80px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />`;
      }

      // Resolve subject and grade level
      const firstTopic = a.topics || ''
      const subjectName =
        firstTopic?.grade_subject?.subject?.name ||
        a.subject?.name ||
        a.subject ||
        "";
      const gradeLevel =
        firstTopic?.grade_subject?.grade_level?.grade_name ||
        a.grade_level ||
        "";

  // Header bar
  const header = document.createElement("div");
  header.style.background = "#e0e7ef"; // lighter for ink saving
  header.style.color = "#222";
  header.style.borderRadius = "14px 14px 0 0";
  header.style.padding = "28px 24px 18px 24px";
  header.style.textAlign = "center";
  header.style.marginBottom = "24px";
  header.style.position = "relative";
      // Logo
      if (schoolLogoHtml) {
        const logoDiv = document.createElement("div");
        logoDiv.innerHTML = schoolLogoHtml;
        logoDiv.style.marginBottom = "8px";
        logoDiv.style.display = "flex";
        logoDiv.style.justifyContent = "center";
        header.appendChild(logoDiv);
      }
      // School name
      const schoolNameH1 = document.createElement("h1");
      schoolNameH1.textContent = a.creator?.school?.school_name || "School Name";
      schoolNameH1.style.fontSize = "2.1rem";
      schoolNameH1.style.fontWeight = "700";
      schoolNameH1.style.margin = "0 0 2px 0";
      schoolNameH1.style.letterSpacing = "0.5px";
      header.appendChild(schoolNameH1);
      // Student name (if not teacher)

      // Assessment title, subject, grade
      const metaDiv = document.createElement("div");
      metaDiv.style.textAlign = "left";
      metaDiv.style.marginTop = "18px";
      metaDiv.innerHTML = `
        <h2 style="font-size: 1.3rem; color: black; font-weight: 600; margin-bottom: 2px;">${this.escapeHtml(a.title || "")}</h2>
        <p style="font-size: 1.1rem; margin: 0; color: #e0e7ef;">Subject: ${this.escapeHtml(subjectName)}${gradeLevel ? ` | Grade: ${this.escapeHtml(gradeLevel)}` : ""}</p>
      `;
      header.appendChild(metaDiv);
      card.appendChild(header);

      // Student info box (only for student PDF)
      if (!isTeacher) {
        const infoBox = document.createElement("div");
        infoBox.style.background = "#f7f7f7";
        infoBox.style.border = "1px solid #e5e7eb";
        infoBox.style.borderRadius = "8px";
        infoBox.style.padding = "14px 16px";
        infoBox.style.margin = "8px 0 16px 0";
        infoBox.style.pageBreakInside = "avoid";
        infoBox.style.breakInside = "avoid";

        const line = (label) => {
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.gap = "10px";
          row.style.margin = "8px 0";
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
        infoBox.appendChild(line("Date"));
        card.appendChild(infoBox);
      }

      // Main content container
      const mainContent = document.createElement("div");
      mainContent.style.padding = "10px 0 0 0";
      // Reserve space at the bottom of each page for the footer
      mainContent.style.paddingBottom = "80px";
      // Prefer natural word wrapping, avoid breaking words mid-page
      mainContent.style.wordBreak = "normal";
      mainContent.style.overflowWrap = "break-word";
      mainContent.style.hyphens = "none";

      // Total marks
      const totalMarks = qs.reduce(
        (sum, q) => sum + (parseFloat(q.marks || 0) || 0),
        0
      );

      // Instructions box
      const instructions = document.createElement("div");
      instructions.style.background = "#f3f4f6";
      instructions.style.borderLeft = "6px solid #374151";
      instructions.style.borderRadius = "6px";
      instructions.style.padding = "12px 16px";
      instructions.style.margin = "0 0 16px 0";
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

      const bullets = [
        "Write your name and class/grade in the spaces provided above.",
        "Answer all questions in the spaces provided.",
        "For multiple choice questions, circle or tick the correct answer.",
        "Show all working where necessary.",
        `Total marks: ${totalMarks}`,
      ];
      bullets.forEach((b) => {
        const li = document.createElement("li");
        li.style.margin = "4px 0";
        li.textContent = b;
        ulInst.appendChild(li);
      });
      instructions.appendChild(ulInst);
      card.appendChild(instructions);

      // Questions
      qs.forEach((q, idx) => {
        const questionDiv = document.createElement("div");
        questionDiv.style.marginBottom = "20px";
        questionDiv.style.pageBreakInside = "avoid";
        questionDiv.style.breakInside = "avoid";
        questionDiv.style.pageBreakBefore = "auto";
        questionDiv.style.pageBreakAfter = "auto";
        questionDiv.style.hyphens = "none";
        questionDiv.classList.add("avoid-page-break");

        // Header with marks
        const qHeader = document.createElement("h2");
        qHeader.style.fontSize = "1.1rem";
        qHeader.style.marginBottom = "10px";
        qHeader.style.borderBottom = "1px solid #e0e7ef";
        qHeader.style.paddingBottom = "5px";
        qHeader.style.pageBreakInside = "avoid";
        qHeader.style.breakInside = "avoid";
        qHeader.style.color = "#4f46e5";
        qHeader.innerHTML = `Question ${
          idx + 1
        } <span style=\"color: #fbbf24; float: right; font-weight: normal;\">[marks: ${
          q.marks || 0
        }]<\/span>`;
        questionDiv.appendChild(qHeader);

        // Question text
        const qText = document.createElement("div");
        qText.style.marginBottom = "10px";
        qText.style.fontSize = "1.05rem";
        qText.style.pageBreakInside = "avoid";
        qText.style.breakInside = "avoid";
        // Avoid breaking words across pages; allow breaking long URLs/words if needed
        qText.style.wordBreak = "normal";
        qText.style.overflowWrap = "break-word";
        qText.style.hyphens = "none";
        const qTextHtml = q.is_math
          ? this.renderSmartMath(q.question_text, { allowBlock: true })
          : this.escapeHtml(q.question_text);
        qText.innerHTML = qTextHtml;
        questionDiv.appendChild(qText);

        // Image
        if (q.question_image) {
          const img = document.createElement("img");
          img.src = this.storageUrl(q.question_image);
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

        // Options / Types
        const qType = String(q.question_type).toLowerCase();
        if (qType === "matching") {
          // Render matching left/right columns
          const container = document.createElement("div");
          container.style.display = "flex";
          container.style.flexWrap = "wrap";
          container.style.gap = "24px";
          container.style.marginLeft = "10px";
          container.style.pageBreakInside = "avoid";
          container.style.breakInside = "avoid";

          const col = (title, items) => {
            const wrap = document.createElement("div");
            wrap.style.flex = "1";
            wrap.style.pageBreakInside = "avoid";
            wrap.style.breakInside = "avoid";
            const h = document.createElement("div");
            h.style.fontWeight = "bold";
            h.style.marginBottom = "6px";
            h.style.color = "#4f46e5";
            h.textContent = title;
            wrap.appendChild(h);

            const ul = document.createElement("ul");
            ul.style.margin = "0";
            ul.style.paddingLeft = "18px";
            ul.style.pageBreakInside = "avoid";
            ul.style.breakInside = "avoid";
            (items || []).forEach((txt, i) => {
              const li = document.createElement("li");
              li.style.marginBottom = "4px";
              li.style.pageBreakInside = "avoid";
              li.style.breakInside = "avoid";
              li.innerHTML = q.is_math
                ? this.renderSmartMath(txt ?? `Item ${i + 1}`, { allowBlock: false })
                : this.escapeHtml(txt ?? `Item ${i + 1}`);
              ul.appendChild(li);
            });
            wrap.appendChild(ul);
            return wrap;
          };

          container.appendChild(col("Left", q.matching_items?.left || []));
          container.appendChild(col("Right", q.matching_items?.right || []));
          questionDiv.appendChild(container);

          if (
            isTeacher && Array.isArray(q.matching_pairs) && q.matching_pairs.length
          ) {
            const pairsDiv = document.createElement("div");
            pairsDiv.style.marginTop = "8px";
            pairsDiv.style.pageBreakInside = "avoid";
            pairsDiv.style.breakInside = "avoid";
            const title = document.createElement("div");
            title.style.fontWeight = "bold";
            title.style.color = "#4f46e5";
            title.textContent = "Correct Pairs:";
            pairsDiv.appendChild(title);
            const ul = document.createElement("ul");
            ul.style.margin = "4px 0 0 18px";
            ul.style.pageBreakInside = "avoid";
            ul.style.breakInside = "avoid";
            q.matching_pairs.forEach((p) => {
              const li = document.createElement("li");
              li.style.pageBreakInside = "avoid";
              li.style.breakInside = "avoid";
              const leftTxt =
                q.matching_items?.left?.[p.left_index] ?? `Left ${p.left_index + 1}`;
              const rightTxt =
                q.matching_items?.right?.[p.right_index] ?? `Right ${p.right_index + 1}`;
              li.textContent = `${leftTxt} → ${rightTxt}`;
              ul.appendChild(li);
            });
            pairsDiv.appendChild(ul);
            questionDiv.appendChild(pairsDiv);
          }
        } else if (qType === "short_answer") {
          if (isTeacher) {
            const ansWrap = document.createElement("div");
            ansWrap.style.marginLeft = "10px";
            ansWrap.style.marginTop = "6px";
            ansWrap.style.pageBreakInside = "avoid";
            ansWrap.style.breakInside = "avoid";
            const title = document.createElement("div");
            title.style.fontWeight = "bold";
            title.style.color = "#4f46e5";
            title.textContent = "Answer:";
            ansWrap.appendChild(title);
            const ans = document.createElement("div");
            ans.style.pageBreakInside = "avoid";
            ans.style.breakInside = "avoid";
            const txt = String(q.correct_answer ?? "");
            ans.innerHTML = q.is_math
              ? this.renderSmartMath(txt, { allowBlock: true })
              : this.escapeHtml(txt);
            ansWrap.appendChild(ans);
            questionDiv.appendChild(ansWrap);
          } else {
            // Leave writing space: 5 lines
            const lines = document.createElement("div");
            lines.style.margin = "8px 10px 0 10px";
            lines.style.pageBreakInside = "avoid";
            lines.style.breakInside = "avoid";
            for (let i = 0; i < 5; i++) {
              const line = document.createElement("div");
              line.style.borderBottom = "1px solid #333";
              line.style.height = "22px";
              line.style.marginBottom = "10px";
              line.style.pageBreakInside = "avoid";
              line.style.breakInside = "avoid";
              lines.appendChild(line);
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
          tf.forEach((label, idx) => {
            const isCorrect = label === correct;
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
            optDiv.innerHTML = `<strong style=\"color:#4f46e5\">${String.fromCharCode(65 + idx)}.</strong> ${label.charAt(0).toUpperCase() + label.slice(1)} ${
              isTeacher && isCorrect ? '<span style=\"color:green; font-weight: bold;\">(✔)</span>' : ""
            }`;
            optsWrap.appendChild(optDiv);
          });
          questionDiv.appendChild(optsWrap);
        } else {
          const optsWrap = document.createElement("div");
          optsWrap.style.display = "flex";
          optsWrap.style.flexWrap = "wrap";
          optsWrap.style.gap = "12px 24px";
          optsWrap.style.margin = "6px 0 0 10px";
          optsWrap.style.pageBreakInside = "avoid";
          optsWrap.style.breakInside = "avoid";
          (q.options || []).forEach((opt, oidx) => {
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

            const textHtml = q.is_math
              ? this.renderSmartMath(opt.option_text, { allowBlock: false })
              : this.escapeHtml(opt.option_text);
            const correctMark = isTeacher && opt.is_correct
              ? '<span style=\"color:green; font-weight: bold;\">(✔)</span>'
              : "";

            // Base text content
            optDiv.innerHTML = `<strong style=\"color:#4f46e5\">${String.fromCharCode(65 + oidx)}.</strong> ${textHtml} ${correctMark}`;

            // Optional option image
            if (opt.option_image) {
              const img = document.createElement("img");
              img.src = this.storageUrl(opt.option_image);
              img.style.maxWidth = "260px";
              img.style.maxHeight = "140px";
              img.style.display = "block";
              img.style.marginTop = "6px";
              img.style.borderRadius = "6px";
              img.style.pageBreakInside = "avoid";
              img.style.breakInside = "avoid";
              optDiv.appendChild(img);
            }

            optsWrap.appendChild(optDiv);
          });
          questionDiv.appendChild(optsWrap);
        }

        mainContent.appendChild(questionDiv);
      });

      card.appendChild(mainContent);
      pdfContent.appendChild(card);

  // Removed bottom total marks footer to avoid duplication; shown in instructions

      // Footer (handled per-page by jsPDF below)

      // Generate PDF (return promise so callers can await)
      return html2pdf()
        .set({
          // top, right, bottom, left (in mm)
          margin: [18, 12, 30, 12],
          filename: `${isTeacher ? "teacher" : "student"}-${(
            a.title || "assessment"
          )
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: [".avoid-page-break", "img", ".katex"] },
        })
        .from(pdfContent)
        .toPdf()
        .get('pdf')
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
            // Place footer within bottom margin area to avoid overlapping content
            pdf.text(footerText, 105, 285, { align: 'center' });
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
