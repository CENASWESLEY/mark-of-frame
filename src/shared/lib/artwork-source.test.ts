import { describe, expect, it } from "vitest";
import { artworkSource } from "./artwork-source";

describe("portable artwork paths", () => {
  it("resolves stored bundled covers under a GitHub Pages project path", () => {
    expect(artworkSource("/images/interstellar.jpg", "/mark-of-frame/")).toBe(
      "/mark-of-frame/images/interstellar.jpg",
    );
    expect(
      artworkSource("/images/one-piece-east-blue.png", "/mark-of-frame"),
    ).toBe("/mark-of-frame/images/one-piece-east-blue.png");
  });
  it("keeps local Next.js and root-hosted Site paths unchanged", () => {
    expect(artworkSource("/images/interstellar.jpg")).toBe(
      "/images/interstellar.jpg",
    );
  });
  it("preserves external artwork, empty covers and unrelated paths", () => {
    for (const source of [
      "https://image.tmdb.org/t/p/w500/poster.jpg",
      "",
      "/other/image.jpg",
      "images/already-relative.jpg",
    ]) {
      expect(artworkSource(source, "/mark-of-frame/")).toBe(source);
    }
  });
});
