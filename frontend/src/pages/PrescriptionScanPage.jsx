import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { GlassCard, GlassButton } from "../components/glass";
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
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Eye,
  AlertCircle,
  CheckCheck,
  FileCheck,
  Layers,
  Info,
  Send,
  UserCheck
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PrescriptionScanPage = () => {
  const { t } = useTranslation(["consult", "common"]);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { addToCart } = useCart();

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const imageContainerRef = useRef(null);

  // File & Document State
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pan & Zoom Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState("original"); // "original" | "enhanced"

  // Reset pan & zoom when file changes
  const resetViewport = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setViewMode("original");
  }, []);

  // ---------- FILE PROCESSOR ----------
  const processFile = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isDocPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isDocPdf) {
      toast.error("Please select a valid image (PNG, JPG, JPEG, WEBP) or PDF prescription file");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit. Please select a smaller photo or PDF.");
      return;
    }

    setSelectedFile(file);
    setIsPdf(isDocPdf);
    resetViewport();
    setResult(null);

    if (isDocPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        setPdfDataUrl(reader.result);
        setPreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(URL.createObjectURL(file));
      setPdfDataUrl(null);
    }
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

  const handleDropzoneKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // ---------- HIGH-RESOLUTION IMAGE PREPARATION ----------
  // Retains full resolution up to 3200px (so fine cursive pen strokes are never squashed)
  const prepareDocumentForScan = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fullDataUrl = reader.result;
        // If it's a PDF, send data URL directly
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          return resolve(fullDataUrl);
        }

        // For images: normalize and bound max dimension to 3200px while retaining crispness
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 3200;
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (width <= maxDim && height <= maxDim) {
              // Direct upload if within safe bounds
              return resolve(fullDataUrl);
            }

            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const highResJpeg = canvas.toDataURL("image/jpeg", 0.94);
            resolve(highResJpeg);
          } catch {
            resolve(fullDataUrl);
          }
        };
        img.onerror = () => resolve(fullDataUrl);
        img.src = fullDataUrl;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // ---------- SCAN LOGIC ----------
  const handleScan = async () => {
    if (!selectedFile) return;

    setScanning(true);

    try {
      const base64Image = await prepareDocumentForScan(selectedFile);

      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${API_URL}/prescriptions/scan`,
        {
          base64Image,
          provider: "hybrid",
          saveToAccount: Boolean(token)
        },
        {
          headers,
          timeout: 60000
        }
      );

      setResult(res.data);
      toast.success("Prescription analyzed with Clinical AI Engine!");
    } catch (err) {
      console.error("Prescription scan error:", err);
      let errorMsg = "Failed to analyze prescription. Please ensure the handwriting is legible and try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 413) {
        errorMsg = "Prescription file is too large. Please select a photo under 15MB.";
      } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = "Scanning timed out. The medical model is warming up; please retry.";
      }
      toast.error(errorMsg);
    } finally {
      setScanning(false);
    }
  };

  // ---------- SUBMIT FOR PHARMACIST REVIEW ----------
  const handleSubmitForReview = async () => {
    if (!token) {
      toast.info("Please sign in or create an account to submit your prescription for verified pharmacist review.");
      navigate("/login?redirect=/prescription-scan");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a prescription first.");
      return;
    }

    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (result?.parsed) {
        formData.append("parsedData", JSON.stringify(result.parsed));
      }

      const res = await axios.post(`${API_URL}/prescriptions/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        toast.success(
          "Prescription and AI handwriting observations submitted to Registered Pharmacist Queue. A licensed pharmacist will audit the handwritten items before dispensing.",
          { duration: 6000 }
        );
      }
    } catch (err) {
      console.error("Pharmacist review submission failed:", err);
      toast.error("Failed to forward prescription for review. Please try again.");
    } finally {
      setSubmittingReview(false);
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
        toast.error(`"${medicineName}" not currently found in catalog inventory.`);
      }
    } catch {
      toast.error("Failed to add medicine to cart");
    }
  };

  // ---------- CLEAR ----------
  const clearFile = () => {
    if (preview && !isPdf) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview(null);
    setIsPdf(false);
    setPdfDataUrl(null);
    setResult(null);
    resetViewport();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // ---------- PAN & ZOOM HANDLERS ----------
  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.35).toFixed(2)), 4.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.35).toFixed(2)), 1.0));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || zoom <= 1) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Active displayed image URL (Original vs Enhanced)
  const activeImageUrl =
    viewMode === "enhanced" && result?.previewImage
      ? result.previewImage
      : preview;

  return (
    <div className="min-h-screen glass-ambient-mesh text-foreground">
      <Navbar />

      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 sm:py-10">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20 shadow-xs">
          <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Prescription Intelligence V2 • Zero-Hallucination Pharmacist Verification</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 text-foreground">
          {t("consult:scanner.title") || "AI Handwritten Prescription Scanner"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-3xl leading-relaxed">
          Upload any Indian doctor prescription (handwritten, cursive, or digital slip). Our clinical multimodal AI normalizes image contrast, extracts medicine candidates, identifies uncertain script lines, and facilitates mandatory pharmacist sign-off.
        </p>

        {/* Quality Audit Feedback Banner (When scan is completed) */}
        {result?.quality && (
          <div className="mb-6 p-4 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Document Quality Audit
                </span>
                <Badge
                  variant="outline"
                  className={
                    result.quality.isLegible
                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]"
                      : "border-amber-500/30 text-amber-600 bg-amber-500/10 text-[10px]"
                  }
                >
                  {result.quality.isLegible ? "Optimal Quality" : "Needs Review"}
                </Badge>
                {result.isDualPass && (
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/10 text-[10px]">
                    Dual-Pass Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                {result.quality.dimensions && (
                  <span>
                    {result.quality.dimensions.width}×{result.quality.dimensions.height}px
                  </span>
                )}
                {result.quality.edgeVariance !== undefined && (
                  <span>Laplacian Score: {result.quality.edgeVariance}</span>
                )}
              </div>
            </div>

            {/* Warnings list if any */}
            {result.quality.warnings && result.quality.warnings.length > 0 && (
              <div className="pt-1 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                {result.quality.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* UPLOAD & VIEWPORT CARD */}
          <GlassCard variant="elevated" className="rounded-3xl shadow-glass p-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="font-heading text-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
                  Prescription Intake
                </span>
                {selectedFile && !isPdf && (
                  <div className="flex items-center gap-1">
                    {result?.previewImage && (
                      <Button
                        size="sm"
                        variant={viewMode === "enhanced" ? "default" : "outline"}
                        className="h-7 text-xs px-2.5 rounded-lg"
                        onClick={() => setViewMode(viewMode === "original" ? "enhanced" : "original")}
                        title="Toggle Sharp Preprocessed View"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {viewMode === "enhanced" ? "Enhanced" : "Original"}
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Supports high-resolution PNG, JPG, WEBP photos and multi-page PDF documents up to 15MB.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-3 space-y-4">
              {!preview && !isPdf ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload prescription image or PDF dropzone"
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
                    {isDragging ? "Drop your prescription here" : "Drag and drop prescription photo or PDF"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Take a clear photo of handwritten doctor slips or upload digital e-prescriptions.
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
                  {/* Interactive Pan & Zoom Viewport for Images */}
                  {!isPdf ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-slate-950/5 dark:bg-slate-900/40 select-none">
                      {/* Controls overlay */}
                      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-background/80 backdrop-blur-md border border-border/60 shadow-xs">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
                          onClick={handleZoomIn}
                          disabled={zoom >= 4}
                          title="Zoom In"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
                          onClick={handleZoomOut}
                          disabled={zoom <= 1}
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
                          onClick={handleRotate}
                          title="Rotate 90°"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
                          onClick={resetViewport}
                          title="Reset View"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-[10px] font-mono font-semibold px-1 text-muted-foreground">
                          {Math.round(zoom * 100)}%
                        </span>
                      </div>

                      {/* Close / Change image button */}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-3 right-3 rounded-full shadow-md z-20 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={clearFile}
                        aria-label="Remove uploaded prescription"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>

                      {/* Image Canvas Container */}
                      <div
                        ref={imageContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`h-84 sm:h-96 w-full flex items-center justify-center overflow-hidden p-2 ${
                          zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                        }`}
                      >
                        <img
                          src={activeImageUrl}
                          alt="Prescription preview"
                          draggable={false}
                          style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transition: isPanning ? "none" : "transform 0.15s ease-out"
                          }}
                          className="max-h-full max-w-full object-contain pointer-events-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* PDF Document Preview Card */
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/40 p-6 flex flex-col items-center justify-center text-center">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-3 right-3 rounded-full shadow-md z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={clearFile}
                        aria-label="Remove uploaded PDF"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>

                      <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                        <FileText className="h-8 w-8" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF Prescription Document • {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        ✓ Ready for Multi-Engine Direct Document AI Extraction
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium text-foreground">
                      {selectedFile?.name || "prescription"}
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
                      Change Document
                    </Button>
                    <GlassButton
                      variant="primary"
                      size="md"
                      className="flex-2"
                      onClick={handleScan}
                      disabled={scanning}
                      data-testid="scan-prescription-submit-btn"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Deciphering Cursive...
                        </>
                      ) : (
                        <>
                          <ScanLine className="mr-2 h-4 w-4" aria-hidden="true" />
                          Extract Medicines
                        </>
                      )}
                    </GlassButton>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                aria-label="Upload prescription image or PDF file"
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

              {/* Patient Safety & Privacy Callout */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground font-semibold">Clinical Rule 65 Guard:</strong> Encrypted in transit. AI provides deciphering assistance only. All Schedule H/H1 prescription medications require licensed pharmacist sign-off before dispensing.
                </p>
              </div>
            </CardContent>
          </GlassCard>

          {/* RESULT CARD */}
          <GlassCard variant="default" className="rounded-3xl shadow-glass flex flex-col p-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="font-heading text-xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  Clinical Extraction Results
                </span>
                {result?.parsed?.medicines && (
                  <Badge variant="secondary" className="text-xs">
                    {result.parsed.medicines.length} Items Found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Zero-hallucination analysis cross-referenced with CDSCO and Jan Aushadhi catalogs
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-3 flex-1 flex flex-col justify-between">
              {scanning ? (
                <div className="py-20 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <ScanLine className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base">Deciphering Prescription Script...</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Auto-rotating EXIF, balancing contrast, and matching cursive strokes against approved Indian pharmaceutical salt registers.
                    </p>
                  </div>
                </div>
              ) : !result ? (
                <div className="py-20 text-center text-muted-foreground my-auto">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 text-muted-foreground/40 flex items-center justify-center mx-auto mb-3">
                    <Pill className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-foreground text-base">No prescription analyzed yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Select a photo or PDF on the left, then click "Extract Medicines" to inspect recognized line items and safety indicators.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Doctor & Patient Metadata if available */}
                  {(result.parsed?.doctor?.doctorName || result.parsed?.patient?.patientName) && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border/50 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Prescribing Doctor</span>
                        <span className="font-semibold text-foreground">
                          {result.parsed.doctor?.doctorName || "Not explicitly legible"}
                        </span>
                        {result.parsed.doctor?.qualification && (
                          <span className="text-[11px] text-muted-foreground block">
                            {result.parsed.doctor.qualification}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Patient</span>
                        <span className="font-semibold text-foreground">
                          {result.parsed.patient?.patientName || "Patient record"}
                        </span>
                        {result.parsed.prescriptionDate && (
                          <span className="text-[11px] text-muted-foreground block">
                            Date: {result.parsed.prescriptionDate}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detected Medicines List */}
                  <div>
                    <h4 className="font-heading font-semibold text-sm mb-3 flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" aria-hidden="true" />
                        Identified Medications
                      </span>
                      {result.parsed?.hasUncertainFields && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-[10px]">
                          Uncertain Lines Require Review
                        </Badge>
                      )}
                    </h4>

                    {result.parsed?.medicines?.length > 0 ? (
                      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                        {result.parsed.medicines.map((med, i) => {
                          const state =
                            med.visualState ||
                            (med.recognitionStatus === "ILLEGIBLE" || (!med.medicineName && (!med.possibleMatches || med.possibleMatches.length === 0))
                              ? "RED"
                              : med.recognitionStatus === "UNCERTAIN" ||
                                med.missingStrengthWarning ||
                                med.lasaAlert ||
                                (med.possibleMatches && med.possibleMatches.length > 0) ||
                                !med.medicineName
                              ? "AMBER"
                              : "GREEN");

                          if (state === "GREEN") {
                            return (
                              <div
                                key={i}
                                className="p-3.5 rounded-xl border transition-all bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-sm text-foreground">
                                        {med.medicineName || med.name}
                                      </p>
                                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0 flex items-center gap-1 font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                        AI Recognized • Pharmacist Verification Pending
                                      </Badge>
                                    </div>

                                    {med.sourceText && med.sourceText !== med.medicineName && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                                        Deciphered from: "{med.sourceText}"
                                      </p>
                                    )}

                                    {/* Attributes */}
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                      {(med.strength || med.dosage) && (
                                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                          {med.strength || med.dosage}
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

                                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                                      * Prescription order requires licensed pharmacist clinical verification before dispatch.
                                    </p>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="rounded-xl px-3.5 h-8 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 active-press"
                                    onClick={() => handleAddMedicineToCart(med.medicineName || med.name)}
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                    Add to Cart
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          if (state === "AMBER") {
                            return (
                              <div
                                key={i}
                                className="p-3.5 rounded-xl border transition-all bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[11px] px-2 py-0.5 flex items-center gap-1 font-semibold">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      Possible Interpretation • Requires Confirmation
                                    </Badge>
                                    <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-medium">
                                      Unverified by Pharmacist
                                    </span>
                                  </div>

                                  {/* Observed pen strokes snippet */}
                                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">Observed Handwriting: </span>
                                    <span className="font-mono font-medium">"{med.recognizedFragment || med.sourceText || 'Partially legible pen strokes'}"</span>
                                    {med.strength && (
                                      <span className="ml-2 font-sans text-[11px] text-muted-foreground">
                                        (Observed strength: {med.strength})
                                      </span>
                                    )}
                                  </div>

                                  {/* Warning Chips */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {med.missingStrengthWarning && (
                                      <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>⚠️ Missing / Incomplete Strength — Dosage verification needed</span>
                                      </div>
                                    )}
                                    {med.lasaAlert && (
                                      <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>⚠️ High-Risk Sound-Alike (LASA): {med.lasaAlert.warning || "Confusable drug name"}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Candidate Suggestions */}
                                  {med.possibleMatches && med.possibleMatches.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                      <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        Evidence-Grounded Possible Interpretations ({med.possibleMatches.length}):
                                      </p>
                                      <div className="grid gap-1.5 sm:grid-cols-2">
                                        {med.possibleMatches.slice(0, 3).map((match, mIdx) => (
                                          <div
                                            key={mIdx}
                                            className="p-2 rounded-lg bg-background/80 border border-amber-500/20 text-xs flex flex-col justify-between"
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="font-semibold text-foreground">{match.medicineName}</span>
                                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                                Unverified
                                              </span>
                                            </div>
                                            {match.evidence && (
                                              <p className="text-[10px] text-muted-foreground mt-1">
                                                Evidence: {match.evidence}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Clinical Safety Action Bar */}
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                                    <span className="text-[10px] text-muted-foreground">
                                      Direct cart addition disabled for patient safety.
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl px-3 h-8 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 active-press shrink-0"
                                      onClick={handleSubmitForReview}
                                      disabled={submittingReview}
                                    >
                                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                                      Request Pharmacist Confirmation
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // RED: Illegible line / zero hallucination
                          return (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl border transition-all bg-red-500/5 border-red-500/30"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <Badge variant="outline" className="border-red-500/50 text-red-600 dark:text-red-400 bg-red-500/10 text-[11px] px-2 py-0.5 flex items-center gap-1 font-semibold">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Illegible Line • Zero Hallucination
                                  </Badge>
                                  <span className="text-[10px] text-red-600/90 dark:text-red-400/90 font-medium">
                                    Unreadable by AI
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-900 dark:text-red-200">
                                  <p className="font-semibold text-red-700 dark:text-red-300">
                                    Cannot safely decipher medication from visible pen strokes.
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    MedsZop strictly prevents guessing drug names to avoid clinical risk.
                                    {med.sourceText && (
                                      <span className="font-mono block mt-1">Scattered strokes: "{med.sourceText}"</span>
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-500/20">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl px-3 h-8 text-xs font-medium text-foreground hover:bg-muted"
                                    onClick={clearFile}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Retake Photo
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl px-3 h-8 text-xs font-semibold border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/10 active-press"
                                    onClick={handleSubmitForReview}
                                    disabled={submittingReview}
                                  >
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    Request Pharmacist Review
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border/80 rounded-xl">
                        <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-amber-500" aria-hidden="true" />
                        <p className="font-medium text-foreground">No legible medications detected</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          The handwriting may be heavily occluded or out of focus. Submit for registered pharmacist review below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Raw Text Snippet */}
                  {result.parsed?.rawExtractedText && (
                    <div>
                      <h4 className="font-heading font-semibold text-xs mb-1 flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                        <CheckCircle className="text-emerald-500 h-3.5 w-3.5" aria-hidden="true" />
                        Multimodal Extraction Log
                      </h4>
                      <div className="p-2.5 bg-muted/60 rounded-xl text-[11px] max-h-20 overflow-auto font-mono text-muted-foreground border border-border/40">
                        {result.parsed.rawExtractedText}
                      </div>
                    </div>
                  )}

                  {/* Action Bar: Submit for Pharmacist Review or Navigate */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={submittingReview}
                      className="w-full rounded-xl h-11 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active-press"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting to Pharmacist Queue...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Request Pharmacist Clinical Verification
                        </>
                      )}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate("/cart")}
                        variant="outline"
                        className="flex-1 rounded-xl h-10 text-xs font-semibold"
                      >
                        Go to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/medicines")}
                        className="flex-1 rounded-xl h-10 text-xs font-medium"
                      >
                        Browse Medicine Catalog
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrescriptionScanPage;
