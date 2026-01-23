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

  // ---------- FILE SELECT ----------
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  // ---------- SCAN LOGIC ----------
  const handleScan = async () => {
    if (!selectedFile) return;

    setScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);

    reader.onload = async () => {
      try {
        const base64Image = reader.result.split(",")[1];

        const res = await axios.post(
          `${API_URL}/prescriptions/scan`,
          { base64Image },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setResult(res.data);
        toast.success("Prescription scanned successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to scan prescription");
      } finally {
        setScanning(false);
      }
    };
  };

  // ---------- ADD TO CART ----------
  const handleAddMedicineToCart = async (medicineName) => {
    try {
      const res = await axios.get(
        `${API_URL}/medicines/search?q=${medicineName}`
      );

      if (res.data?.length > 0) {
        await addToCart(res.data[0]._id, 1);
        toast.success(`${res.data[0].name} added to cart`);
      } else {
        toast.error(`"${medicineName}" not found`);
      }
    } catch {
      toast.error("Failed to add medicine");
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Badge className="mb-4 bg-cyan-500/10 text-cyan-600 border-0">
          <ScanLine className="h-4 w-4 mr-2" />
          AI Powered
        </Badge>

        <h1 className="text-3xl font-bold mb-2">Prescription Scanner</h1>
        <p className="text-muted-foreground mb-8">
          Upload a prescription image and extract medicines automatically
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* UPLOAD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Upload Prescription
              </CardTitle>
              <CardDescription>PNG / JPG images supported</CardDescription>
            </CardHeader>

            <CardContent>
              {!preview ? (
                <div
                  className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
                  <p>Select an image</p>
                  <Button variant="outline" className="mt-4">
                    Browse
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={clearFile}
                  >
                    <X />
                  </Button>
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-64 object-contain rounded-lg bg-muted"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />

              {preview && (
                <Button
                  className="w-full mt-4"
                  onClick={handleScan}
                  disabled={scanning}
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2" />
                      Scan Prescription
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* RESULT */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Scan Results
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!result ? (
                <p className="text-muted-foreground text-center">
                  Scan a prescription to see results
                </p>
              ) : (
                <>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-4 w-4" />
                    Extracted Text
                  </h4>
                  <div className="p-3 bg-muted rounded text-sm mb-4 max-h-32 overflow-auto">
                    {result.rawText}
                  </div>

                  <Separator />

                  <h4 className="font-medium mt-4 mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" /> Medicines
                  </h4>

                  {result.parsed?.medicines?.length > 0 ? (
                    result.parsed.medicines.map((med, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 bg-muted/50 rounded mb-2"
                      >
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <div className="flex gap-2 mt-1">
                            {med.dosage && <Badge>{med.dosage}</Badge>}
                            {med.frequency && <Badge>{med.frequency}</Badge>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMedicineToCart(med.name)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      <AlertTriangle className="mx-auto mb-2" />
                      No medicines detected
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => navigate("/cart")} className="flex-1">
                      Go to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/medicines")}
                      className="flex-1"
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
