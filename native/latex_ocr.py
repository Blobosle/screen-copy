import sys
from rapid_latex_ocr import LaTeXOCR

model = LaTeXOCR()

def main():
    if len(sys.argv) < 2:
        print("Missing image path", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]

    with open(image_path, "rb") as f:
        data = f.read()

    result, _ = model(data)
    print(result.strip())

if __name__ == "__main__":
    main()
