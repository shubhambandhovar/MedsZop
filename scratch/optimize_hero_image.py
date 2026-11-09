import os
from PIL import Image

src_path = "frontend/src/assets/hero-image.webp"
img = Image.open(src_path)
orig_size = os.path.getsize(src_path)
print(f"Original image size: {orig_size:,} bytes ({orig_size / 1024 / 1024:.2f} MB)")
print(f"Original dimensions: {img.size}")

# Keep aspect ratio (1536 x 1024 = 3:2)
targets = [
    (1280, "frontend/src/assets/hero-image-1280"),
    (800, "frontend/src/assets/hero-image-800"),
    (480, "frontend/src/assets/hero-image-480")
]

results = []

for width, base_out in targets:
    height = int(width * img.size[1] / img.size[0])
    resized = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Save AVIF
    avif_out = f"{base_out}.avif"
    resized.save(avif_out, "AVIF", quality=75)
    avif_sz = os.path.getsize(avif_out)
    
    # Save WebP
    webp_out = f"{base_out}.webp"
    resized.save(webp_out, "WEBP", quality=82)
    webp_sz = os.path.getsize(webp_out)
    
    results.append({
        "width": width,
        "height": height,
        "avif": (avif_out, avif_sz),
        "webp": (webp_out, webp_sz)
    })
    print(f"Generated {width}w ({width}x{height}): WebP={webp_sz:,} B ({webp_sz/1024:.1f} KB), AVIF={avif_sz:,} B ({avif_sz/1024:.1f} KB)")

# Also overwrite frontend/src/assets/hero-image.webp with the optimized 1280w WebP
# and frontend/src/assets/hero-image.png with optimized PNG fallback
optimized_1280 = img.resize((1280, int(1280 * img.size[1] / img.size[0])), Image.Resampling.LANCZOS)
optimized_1280.save("frontend/src/assets/hero-image.webp", "WEBP", quality=82)
new_hero_sz = os.path.getsize("frontend/src/assets/hero-image.webp")
print(f"\nDefault hero-image.webp replaced with optimized WebP: {new_hero_sz:,} B ({new_hero_sz/1024:.1f} KB) - reduction: {((orig_size - new_hero_sz)/orig_size)*100:.1f}%")

# Generate standard fallback PNG
optimized_1280.save("frontend/src/assets/hero-image.png", "PNG", optimize=True)
png_sz = os.path.getsize("frontend/src/assets/hero-image.png")
print(f"Fallback hero-image.png generated: {png_sz:,} B ({png_sz/1024:.1f} KB)")

