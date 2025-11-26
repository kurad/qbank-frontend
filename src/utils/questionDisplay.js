// Shared helpers for displaying questions and options across assessment components
import axios from "axios";

export function parseOptions(options) {
  try {
    if (typeof options === "string") return JSON.parse(options);
    return Array.isArray(options) ? options : [];
  } catch (e) {
    return [];
  }
}

export function getOptionValue(opt) {
  if (opt == null) return "";
  if (typeof opt === "object") {
    if (Object.prototype.hasOwnProperty.call(opt, "option_text"))
      return String(opt.option_text ?? "");
    return String(opt.text ?? opt.value ?? "");
  }
  return String(opt);
}

export function isCorrectOption(correct, candidate) {
  try {
    const c = typeof correct === "string" ? correct.trim() : correct;
    const v = typeof candidate === "string" ? candidate.trim() : candidate;
    if (typeof c === "string" && typeof v === "string") {
      return c.toLowerCase() === v.toLowerCase();
    }
    if (typeof c === "boolean") {
      const vv = String(v).toLowerCase();
      return (c && vv === "true") || (!c && vv === "false");
    }
    return c === v;
  } catch (_) {
    return false;
  }
}

export function getMatchingItems(q) {
  const out = { left: [], right: [], pairs: [] };
  if (!q) return out;
  let opts = q.options;
  if (typeof opts === "string") {
    try {
      opts = JSON.parse(opts);
    } catch {
      opts = {};
    }
  }
  const left = Array.isArray(opts?.left) ? opts.left : [];
  const right = Array.isArray(opts?.right) ? opts.right : [];
  let pairs = q.correct_answer;
  if (typeof pairs === "string") {
    try {
      pairs = JSON.parse(pairs);
    } catch {
      pairs = [];
    }
  }
  if (!Array.isArray(pairs)) pairs = [];
  return { left, right, pairs };
}

export function getOptionImageUrl(opt) {
  if (!opt || typeof opt !== "object" || !opt.image) return "";
  if (opt.image.startsWith("http://") || opt.image.startsWith("https://")) {
    return opt.image;
  }
  try {
    const base = (axios.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
    if (base) return `${base}/storage/${opt.image}`;
  } catch {}
  return `/storage/${opt.image}`;
}

export function getQuestionImageUrl(question) {
  if (!question) return "";
  const src = question.question_image_url || question.question_image;
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  try {
    const base = (axios.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
    if (base) return `${base}/storage/${src}`;
  } catch {}
  return `/storage/${src}`;
}
