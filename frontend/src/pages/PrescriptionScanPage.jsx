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
  FileText
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Badge className="mb-4 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0 px-3.5 py-1 text-xs font-semibold rounded-full">
          <ScanLine className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          AI Powered
        </Badge>

        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
          Prescription Scanner
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
          Upload a prescription image and extract medicines automatically with intelligent clinical recognition.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* UPLOAD CARD */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" aria-hidden="true" /> Upload Prescription
              </CardTitle>
              <CardDescription>PNG, JPG, or WEBP images supported</CardDescription>
            </CardHeader>

            <CardContent>
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
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isDragging
                      ? "border-primary bg-primary/10 ring-2 ring-primary scale-[1.01]"
                      : "border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <ImageIcon className="h-14 w-14 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                  <p className="font-medium text-foreground">
                    {isDragging ? "Drop your prescription here" : "Drag and drop or select an image"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Supports handwritten and printed prescriptions</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 rounded-full px-6 shadow-sm hover:shadow transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-muted">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 rounded-full shadow-md z-10"
                    onClick={clearFile}
                    aria-label="Remove uploaded prescription image"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <img
                    src={preview}
                    alt="Prescription preview"
                    className="w-full h-72 object-contain bg-slate-950/5 dark:bg-slate-950/40"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload prescription image file"
                hidden
                onChange={handleFileSelect}
              />

              {preview && (
                <Button
                  className="w-full mt-5 rounded-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
                  onClick={handleScan}
                  disabled={scanning}
                  data-testid="scan-prescription-submit-btn"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Scanning with AI Vision...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-5 w-5" aria-hidden="true" />
                      Scan Prescription
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* RESULT CARD */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Scan Results
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!result ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
                  <p className="font-medium text-foreground">No prescription scanned yet</p>
                  <p className="text-sm mt-1">Upload a prescription image and click scan to see results</p>
                </div>
              ) : (
                <>
                  <h4 className="font-heading font-semibold mb-2 flex items-center gap-2 text-foreground">
                    <CheckCircle className="text-emerald-500 h-4 w-4" aria-hidden="true" />
                    Extracted Text
                  </h4>
                  <div className="p-3.5 bg-muted rounded-xl text-sm mb-4 max-h-32 overflow-auto font-mono text-muted-foreground">
                    {result.rawText}
                  </div>

                  <Separator className="my-4" />

                  <h4 className="font-heading font-semibold mt-4 mb-3 flex items-center gap-2 text-foreground">
                    <Pill className="h-4 w-4 text-primary" aria-hidden="true" /> Detected Medicines
                  </h4>

                  {result.parsed?.medicines?.length > 0 ? (
                    <div className="space-y-2.5">
                      {result.parsed.medicines.map((med, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-3.5 bg-muted/60 dark:bg-muted/30 rounded-xl border border-slate-100 dark:border-slate-800"
                        >
                          <div>
                            <p className="font-medium text-foreground">{med.name}</p>
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {med.dosage && (
                                <Badge variant="secondary" className="text-xs">
                                  {med.dosage}
                                </Badge>
                              )}
                              {med.frequency && (
                                <Badge variant="outline" className="text-xs">
                                  {med.frequency}
                                </Badge>
                              )}
                              {med.duration && (
                                <Badge variant="outline" className="text-xs">
                                  {med.duration}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="rounded-full px-4 shadow-sm hover:shadow transition-all"
                            onClick={() => handleAddMedicineToCart(med.name)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" aria-hidden="true" />
                      <p className="font-medium text-foreground">No medicines detected</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try taking a clearer, well-lit photo of the prescription and re-uploading.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={() => navigate("/cart")}
                      className="flex-1 rounded-full h-11 font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      Go to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/medicines")}
                      className="flex-1 rounded-full h-11 font-medium transition-all"
                    >
                      Browse Medicines
                    </Button>
                  </div>
                </>
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
