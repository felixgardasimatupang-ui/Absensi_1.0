import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, MapPin, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CheckInOut() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: todayAttendance } = trpc.attendance.getTodayAttendance.useQuery();
  const checkInMutation = trpc.attendance.checkIn.useMutation();
  const checkOutMutation = trpc.attendance.checkOut.useMutation();

  const isCheckedIn = !!todayAttendance?.checkInTime;
  const isCheckedOut = !!todayAttendance?.checkOutTime;

  // Get GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(`Location error: ${error.message}`);
        }
      );
    } else {
      setLocationError("Geolocation not supported");
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error("Failed to access camera");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.7);
        setPhotoData(imageData);
        stopCamera();
      }
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setPhotoData(null);
    startCamera();
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!location) {
      toast.error("Location not available");
      return;
    }

    if (!photoData) {
      toast.error("Please capture a photo");
      return;
    }

    setIsLoading(true);
    try {
      await checkInMutation.mutateAsync({
        latitude: location.lat,
        longitude: location.lng,
        photoBase64: photoData.split(",")[1],
      });
      toast.success("Checked in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Check-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!location) {
      toast.error("Location not available");
      return;
    }

    if (!photoData) {
      toast.error("Please capture a photo");
      return;
    }

    const isConfirmed = window.confirm("Apakah Anda yakin ingin melakukan Check-Out? Aksi ini bersifat final untuk hari ini.");
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      await checkOutMutation.mutateAsync({
        latitude: location.lat,
        longitude: location.lng,
        photoBase64: photoData.split(",")[1],
      });
      toast.success("Checked out successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Check-out failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Check In / Check Out</h1>
          <p className="text-muted-foreground mt-1">Record your attendance with photo and location</p>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Check-In Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {isCheckedIn ? "Checked In" : "Not Checked In"}
                </span>
                <Badge variant={isCheckedIn ? "default" : "outline"}>
                  {isCheckedIn ? "✓" : "—"}
                </Badge>
              </div>
              {isCheckedIn && todayAttendance?.checkInTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(todayAttendance.checkInTime).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Check-Out Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {isCheckedOut ? "Checked Out" : "Not Checked Out"}
                </span>
                <Badge variant={isCheckedOut ? "default" : "outline"}>
                  {isCheckedOut ? "✓" : "—"}
                </Badge>
              </div>
              {isCheckedOut && todayAttendance?.checkOutTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(todayAttendance.checkOutTime).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Location Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationError ? (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : location ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}
                </p>
                <Badge variant="secondary">Location captured ✓</Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Detecting location...</p>
            )}
          </CardContent>
        </Card>

        {/* Camera Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!photoData ? (
              <>
                {isCameraActive ? (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg bg-black"
                    />
                    <div className="flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Photo
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <img src={photoData} alt="Captured" className="w-full rounded-lg" />
                <Button onClick={retakePhoto} variant="outline" className="w-full">
                  Retake Photo
                </Button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleCheckIn}
            disabled={isCheckedIn || !photoData || !location || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {isCheckedIn ? "Already Checked In" : "Check In"}
          </Button>

          <Button
            onClick={handleCheckOut}
            disabled={!isCheckedIn || isCheckedOut || !photoData || !location || isLoading}
            className="w-full"
            size="lg"
            variant="secondary"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {isCheckedOut ? "Already Checked Out" : "Check Out"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
