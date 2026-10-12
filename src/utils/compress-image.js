
import sharp from "sharp";

export const compressProductImage = async (buffer) => {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toBuffer();
};
