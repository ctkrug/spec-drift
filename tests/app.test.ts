// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "../src/ui/app";
import { encodeShareFragment } from "../src/ui/share";

const VALID_OLD =
  '{"openapi": "3.0.0", "paths": {"/pets": {"post": {"parameters": [{"name": "id", "in": "query", "required": false}]}}}}';
const VALID_NEW =
  '{"openapi": "3.0.0", "paths": {"/pets": {"post": {"parameters": [{"name": "id", "in": "query", "required": true}]}}}}';

/** Stubs matchMedia so `sweepThenReveal` takes a deterministic branch. */
function setReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function value(root: HTMLElement, selector: string): string {
  return (root.querySelector(selector) as HTMLTextAreaElement).value;
}

function setValue(root: HTMLElement, selector: string, text: string): void {
  (root.querySelector(selector) as HTMLTextAreaElement).value = text;
}

function click(root: HTMLElement, selector: string): void {
  root.querySelector<HTMLButtonElement>(selector)!.click();
}

function isHidden(root: HTMLElement, selector: string): boolean {
  return (root.querySelector(selector) as HTMLElement).hidden;
}

describe("mountApp", () => {
  let root: HTMLElement;

  beforeEach(() => {
    setReducedMotion(true);
    window.location.hash = "";
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it("mounts the shell with both panes and a hidden report", () => {
    mountApp(root);
    expect(root.querySelector("#input-old")).not.toBeNull();
    expect(root.querySelector("#input-new")).not.toBeNull();
    expect(isHidden(root, "#report-wrap")).toBe(true);
  });

  it("reveals a report after comparing two valid specs", () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    expect(isHidden(root, "#report-wrap")).toBe(false);
    expect(root.querySelector("#report")!.innerHTML).toMatch(/became required/);
  });

  it("shows a per-panel error and keeps the report hidden for malformed input", () => {
    mountApp(root);
    setValue(root, "#input-old", "{not valid json");
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    expect(root.querySelector("#error-old")!.textContent).toMatch(/Invalid JSON/);
    expect(isHidden(root, "#report-wrap")).toBe(true);
  });

  it("clears a previously revealed report when a later compare fails to parse", () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");
    expect(isHidden(root, "#report-wrap")).toBe(false);

    setValue(root, "#input-old", "{not valid json");
    click(root, "#compare-btn");

    expect(isHidden(root, "#report-wrap")).toBe(true);
    expect(root.querySelector("#report")!.innerHTML).toBe("");
  });

  it("loads the sample spec pair into both panes and clears prior errors", () => {
    mountApp(root);
    setValue(root, "#input-old", "{not valid json");
    click(root, "#compare-btn");
    expect(root.querySelector("#error-old")!.textContent).not.toBe("");

    click(root, "#sample-btn");

    expect(value(root, "#input-old").length).toBeGreaterThan(0);
    expect(value(root, "#input-new").length).toBeGreaterThan(0);
    expect(root.querySelector("#error-old")!.textContent).toBe("");
  });

  it("waits for the sweep-line animation to finish before revealing the report", () => {
    setReducedMotion(false);
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    expect(isHidden(root, "#report-wrap")).toBe(true);

    root.querySelector("#sweep-line")!.dispatchEvent(new Event("animationend"));

    expect(isHidden(root, "#report-wrap")).toBe(false);
  });

  it("clicking Export before any compare does not throw", () => {
    mountApp(root);
    expect(() => click(root, "#export-btn")).not.toThrow();
  });

  it("downloads a markdown export after a successful compare", () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    click(root, "#export-btn");

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("copies a share link to the clipboard after a successful compare", async () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    click(root, "#share-btn");
    await Promise.resolve();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalled();
    expect(root.querySelector("#share-status")!.textContent).toMatch(/copied/i);
  });

  it("shows a fallback message instead of throwing when the clipboard write fails", async () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);
    click(root, "#compare-btn");

    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    click(root, "#share-btn");
    await Promise.resolve();
    await Promise.resolve();

    expect(root.querySelector("#share-status")!.textContent).toMatch(/couldn't copy/i);
  });

  it("shows an explicit message instead of a broken link when the spec pair is too large to share", () => {
    mountApp(root);
    setValue(root, "#input-old", "x".repeat(20000));
    setValue(root, "#input-new", VALID_NEW);

    click(root, "#share-btn");

    expect(root.querySelector("#share-status")!.textContent).toMatch(/too large/i);
  });

  it("auto-reproduces a shared report from location.hash on mount", () => {
    const fragment = encodeShareFragment(VALID_OLD, VALID_NEW)!;
    window.location.hash = `#${fragment}`;

    mountApp(root);

    expect(isHidden(root, "#report-wrap")).toBe(false);
    expect(value(root, "#input-old")).toBe(VALID_OLD);
    expect(value(root, "#input-new")).toBe(VALID_NEW);
  });

  it("does not crash mounting with a garbage location.hash", () => {
    window.location.hash = "#not-a-real-fragment!!!";
    expect(() => mountApp(root)).not.toThrow();
    expect(isHidden(root, "#report-wrap")).toBe(true);
  });

  it("survives rapid repeated compare clicks without losing the final result", () => {
    mountApp(root);
    setValue(root, "#input-old", VALID_OLD);
    setValue(root, "#input-new", VALID_NEW);

    click(root, "#compare-btn");
    click(root, "#compare-btn");
    click(root, "#compare-btn");

    expect(isHidden(root, "#report-wrap")).toBe(false);
    expect(root.querySelector("#report")!.innerHTML).toMatch(/became required/);
  });
});
