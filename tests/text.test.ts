import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addPrefixSuffix,
  removePrefixSuffix,
  breakOnText,
  formatRemovedLine,
  removeDuplicateLines,
  removeLineBreaks,
  wrapLines,
} from "../src/lib/text.ts";

describe("prefix and suffix", () => {
  it("wraps every line, including a trailing empty line", () => {
    const result = addPrefixSuffix("a\r\nb\r\n", '"', '",', false);
    assert.equal(result.text, '"a",\n"b",\n"",');
    assert.equal(result.updated, 3);
  });

  it("treats classic Mac breaks as line breaks", () => {
    assert.equal(addPrefixSuffix("a\rb", "-", "", false).text, "-a\n-b");
  });

  it("can skip empty lines", () => {
    const result = addPrefixSuffix("a\n\nb", "x", "y", true);
    assert.equal(result.text, "xay\n\nxby");
    assert.equal(result.skipped, 1);
    assert.equal(result.updated, 2);
  });

  it("removes a prefix and suffix only when they are present", () => {
    const result = removePrefixSuffix('- apple,\n- pear,\nplain', "- ", ",", false);
    assert.equal(result.text, "apple\npear\nplain");
    assert.equal(result.updated, 2);
    assert.equal(result.unchanged, 1);
  });

  it("does not strip the same characters as both prefix and suffix", () => {
    assert.equal(removePrefixSuffix("quote", "quote", "ote", false).text, "");
  });
});

describe("line breaks", () => {
  it("replaces breaks, including a trailing one", () => {
    assert.deepEqual(removeLineBreaks("a\r\nb\n", " | "), {
      text: "a | b | ",
      replaced: 2,
    });
  });

  it("splits on literal text and can clear existing breaks", () => {
    assert.equal(breakOnText("a.b.c", ".", "after", true, false).text, "a.\nb.\nc");
    assert.equal(breakOnText("x\ny.z", ".", "before", true, true).text, "xy\n.z");
    assert.equal(breakOnText("Aa", "a", "after", false, false).text, "A\na\n");
    assert.equal(breakOnText("keep\nme", "", "after", false, true).text, "keepme");
  });

  it("wraps on word boundaries and preserves blank lines", () => {
    assert.equal(wrapLines("hello world", 8, true, false).text, "hello\nworld");
    assert.equal(wrapLines("The quick brown", 9, true, false).text, "The quick\nbrown");
    assert.equal(wrapLines("a\n\nb", 1, false, false).text, "a\n\nb");
    assert.equal(wrapLines("abcd", 2, false, false).text, "ab\ncd");
    assert.equal(wrapLines("a\nb", 10, false, true).text, "a\\nb");
  });
});

describe("duplicate lines", () => {
  it("keeps the first casing and the original order", () => {
    const result = removeDuplicateLines("Banana\nbanana\norange\n\norange", false, false);
    assert.equal(result.text, "Banana\norange\n");
    assert.equal(result.removed.length, 2);
    assert.equal(formatRemovedLine(result.removed[0]), "Line 2 — duplicate of line 1: banana");
  });

  it("drops duplicate lines instead of leaving a blank", () => {
    assert.equal(removeDuplicateLines("a\nb\na\nc\n", true, false).text, "a\nb\nc");
    assert.equal(removeDuplicateLines("a\na\n\nb", true, false).text, "a\n\nb");
  });

  it("keeps every empty line unless asked to drop them", () => {
    assert.equal(removeDuplicateLines("a\n\n\na", true, false).text, "a\n\n");
    const removed = removeDuplicateLines("a\n\n\na", true, true);
    assert.equal(removed.text, "a");
    assert.equal(removed.removed.filter((item) => item.reason === "empty").length, 2);
  });

  it("treats spaces as content", () => {
    const result = removeDuplicateLines("  \n  \nx", true, true);
    assert.equal(result.text, "  \nx");
    assert.equal(result.removed[0]?.reason, "duplicate");
  });
});
