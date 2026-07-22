/**
 * Lightweight verification for desktop attachment helpers used by add forms.
 * Run: npx tsx scripts/test-file-upload-flow.mts
 */
import assert from "node:assert/strict";
import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_FILE_TYPES,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_FILE_BYTES,
  formatFileSize,
  parseAttachments,
  readFileAsAttachment,
} from "../src/lib/file-upload";
import { extractAttachments, stripAttachments } from "../src/lib/form-attachments";

assert.ok(ACCEPTED_DOCUMENT_TYPES.includes(".pdf"));
assert.ok(ACCEPTED_IMAGE_TYPES.includes("image/*") || ACCEPTED_IMAGE_TYPES.includes(".png"));
assert.ok(ACCEPTED_VIDEO_TYPES.includes("video/*") || ACCEPTED_VIDEO_TYPES.includes(".mp4"));
assert.ok(ACCEPTED_FILE_TYPES.includes(".pdf") && ACCEPTED_FILE_TYPES.includes(".mp4"));
assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
assert.equal(formatFileSize(2048), "2.0 KB");
assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");

assert.deepEqual(parseAttachments(null), []);
assert.deepEqual(parseAttachments("[]"), []);
assert.deepEqual(
  parseAttachments([{ name: "a.pdf", mimeType: "application/pdf", fileData: "data:x", size: 12 }]),
  [{ name: "a.pdf", mimeType: "application/pdf", fileData: "data:x", size: 12 }]
);

const withFiles = {
  title: "قضية تأمين",
  attachments: [{ name: "crash.mp4", mimeType: "video/mp4", fileData: "data:video/mp4;base64,aaa", size: 100 }],
};
assert.equal(extractAttachments(withFiles).length, 1);
assert.equal("attachments" in stripAttachments(withFiles), false);
assert.equal(stripAttachments(withFiles).title, "قضية تأمين");

class FakeFileReader {
  result: string | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  readAsDataURL(file: Blob) {
    const type = (file as File).type || "application/octet-stream";
    this.result = `data:${type};base64,ZmFrZQ==`;
    queueMicrotask(() => this.onload?.());
  }
}
(globalThis as unknown as { FileReader: typeof FakeFileReader }).FileReader = FakeFileReader;

const fakeFile = {
  name: "witness.jpg",
  type: "image/jpeg",
  size: 1200,
} as File;

const parsed = await readFileAsAttachment(fakeFile);
assert.ok(parsed);
assert.equal(parsed?.name, "witness.jpg");
assert.equal(parsed?.mimeType, "image/jpeg");
assert.ok(parsed?.fileData.startsWith("data:image/jpeg;base64,"));

const tooBig = { name: "big.mp4", type: "video/mp4", size: MAX_FILE_BYTES + 1 } as File;
assert.equal(await readFileAsAttachment(tooBig), null);

console.log("PASS: file upload flow helpers OK");
