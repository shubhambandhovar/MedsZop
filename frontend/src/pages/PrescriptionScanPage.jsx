import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  ScanLine,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Pill,
  ShoppingCart,
  X,
  FileText,
  Camera,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const PrescriptionScanPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // ---------- FILE PROCESSOR ----------
  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  // ---------- FILE SELECT ----------
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // ---------- DRAG & DROP ----------
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // ---------- KEYBOARD ACTIVATION ----------
  const handleDropzoneKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // ---------- CLIENT-SIDE IMAGE NORMALIZER & COMPRESSOR ----------
  // Normalizes any format (PNG, JPG, WEBP) to standard JPEG, applies white background
  // to transparent PNGs, and caps max dimension at 1600px to ensure instant upload (<300KB)
  // and prevent Gemini [400 Bad Request] format-mismatch or [413] payload errors.
  const prepareImageForScan = (file) => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.HTMLCanvasElement) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 1600;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          // Solid white background ensures transparent PNGs don't turn black in JPEG
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Always produce clean, standardized JPEG
          const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const base64Data = jpegDataUrl.split(",")[1];
          resolve(base64Data);
        } catch (e) {
          console.warn("Canvas compression failed, falling back to FileReader:", e);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  // ---------- SCAN LOGIC ----------
  const handleScan = async () => {
    if (!selectedFile) return;

    setScanning(true);

    try {
      const base64Image = await prepareImageForScan(selectedFile);

      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${API_URL}/prescriptions/scan`,
        { base64Image },
        {
          headers,
          timeout: 45000
        }
      );

      setResult(res.data);
      toast.success("Prescription scanned successfully!");
    } catch (err) {
      console.error("Prescription scan error:", err);
      let errorMsg = "Failed to scan prescription. Please verify the image is readable and try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 413) {
        errorMsg = "Prescription image is too large. Please select a smaller photo.";
      } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = "Scanning timed out. The server might be waking up; please try again.";
      } else if (err.message && !err.message.includes("status code")) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
    } finally {
      setScanning(false);
    }
  };

  // ---------- ADD TO CART ----------
  const handleAddMedicineToCart = async (medicineName) => {
    try {
      const res = await axios.get(
        `${API_URL}/medicines/search?q=${encodeURIComponent(medicineName)}`
      );

      if (res.data?.length > 0) {
        await addToCart(res.data[0]._id, 1);
        toast.success(`${res.data[0].name} added to cart`);
      } else {
        toast.error(`"${medicineName}" not found in current inventory`);
      }
    } catch {
      toast.error("Failed to add medicine to cart");
    }
  };

  // ---------- CLEAR ----------
  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Badge className="mb-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0 px-3.5 py-1 text-xs font-semibold rounded-full">
          <ScanLine className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          AI Powered Prescription Scanner
        </Badge>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
          Upload & Scan Prescription
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-2xl leading-relaxed">
          Upload a paper slip or doctor's digital prescription. Our clinical AI extracts drug names, dosages, and schedules for instant ordering.
        </p>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* UPLOAD CARD */}
          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" aria-hidden="true" /> Upload Document
              </CardTitle>
              <CardDescription>Supports PNG, JPG, JPEG, and WEBP formats up to 10MB</CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-3 space-y-4">
              {!preview ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload prescription image dropzone. Click, drag and drop, or press enter to select an image."
                  onKeyDown={handleDropzoneKeyDown}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isDragging
                      ? "border-primary bg-primary/10 ring-2 ring-primary scale-[1.01]"
                      : "border-border hover:border-primary/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-base text-foreground">
                    {isDragging ? "Drop your prescription here" : "Drag and drop prescription image"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Take a clear photo of handwritten notes or upload a digital doctor slip.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl px-5 h-11 text-xs sm:text-sm font-medium shadow-xs hover:border-primary active-press"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                      Browse Files
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl px-5 h-11 text-xs sm:text-sm font-medium shadow-xs active-press"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/40 flex flex-col items-center">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 right-3 rounded-full shadow-md z-10 h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={clearFile}
                      aria-label="Remove uploaded prescription image"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <img
                      src={preview}
                      alt="Prescription preview"
                      className="w-full max-h-80 object-contain p-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium text-foreground">
                      {selectedFile?.name || "prescription.jpg"}
                    </span>
                    <span>
                      {selectedFile?.size ? `${(selectedFile.size / 1024).toFixed(0)} KB` : "Ready"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl h-11 text-xs sm:text-sm font-medium"
                      onClick={clearFile}
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Change Image
                    </Button>
                    <Button
                      className="flex-2 rounded-xl h-11 text-xs sm:text-sm font-bold shadow-md shadow-primary/20 active-press"
                      onClick={handleScan}
                      disabled={scanning}
                      data-testid="scan-prescription-submit-btn"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Processing with AI...
                        </>
                      ) : (
                        <>
                          <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
                          Extract Medicines
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                aria-label="Upload prescription image file"
                hidden
                onChange={handleFileSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Snap prescription with camera"
                hidden
                onChange={handleFileSelect}
              />

              {/* Privacy and Security Callout */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground font-semibold">Strict Patient Privacy:</strong> Encrypted in transit. Prescriptions are verified by registered pharmacists prior to dispensing and never shared or sold.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RESULT CARD */}
          <Card className="rounded-2xl border-border bg-card shadow-xs flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Extraction Results
              </CardTitle>
              <CardDescription>Verified medications mapped to available inventory</CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-3 flex-1 flex flex-col justify-between">
              {scanning ? (
                <div className="py-16 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <ScanLine className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">Deciphering Prescription...</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Normalizing image contrast and matching handwritten salts against pharmaceutical databases.
                    </p>
                  </div>
                </div>
              ) : !result ? (
                <div className="py-16 text-center text-muted-foreground my-auto">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 text-muted-foreground/40 flex items-center justify-center mx-auto mb-3">
                    <Pill className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-foreground text-base">No prescription scanned yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Select or snap an image on the left, then click "Extract Medicines" to view recognized items.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-heading font-semibold text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                      <CheckCircle className="text-emerald-500 h-4 w-4" aria-hidden="true" />
                      Extracted Text Snippet
                    </h4>
                    <div className="p-3 bg-muted/60 rounded-xl text-xs max-h-28 overflow-auto font-mono text-muted-foreground border border-border/40">
                      {result.rawText || "No raw text detected."}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                      <Pill className="h-4 w-4 text-primary" aria-hidden="true" /> Detected Medicines ({result.parsed?.medicines?.length || 0})
                    </h4>

                    {result.parsed?.medicines?.length > 0 ? (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {result.parsed.medicines.map((med, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center p-3.5 bg-muted/40 rounded-xl border border-border/60 hover:border-primary/40 transition-colors"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="font-semibold text-sm text-foreground truncate">{med.name}</p>
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {med.dosage && (
                                  <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                    {med.dosage}
                                  </Badge>
                                )}
                                {med.frequency && (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                                    {med.frequency}
                                  </Badge>
                                )}
                                {med.duration && (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0">
                                    {med.duration}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl px-3.5 h-9 text-xs font-semibold shadow-xs active-press shrink-0"
                              onClick={() => handleAddMedicineToCart(med.name)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border/80 rounded-xl">
                        <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-amber-500" aria-hidden="true" />
                        <p className="font-medium text-foreground">No medicines detected</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          Try taking a clearer, well-lit photo of the prescription and re-uploading.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border">
                    <Button
                      onClick={() => navigate("/cart")}
                      className="flex-1 rounded-xl h-11 text-xs sm:text-sm font-semibold shadow-md shadow-primary/20 active-press"
                    >
                      Go to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/medicines")}
                      className="flex-1 rounded-xl h-11 text-xs sm:text-sm font-medium active-press"
                    >
                      Browse Catalog
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrescriptionScanPage;
