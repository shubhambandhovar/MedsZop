import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShieldCheck, Video, ArrowLeft, Loader2, Lock, Radio } from 'lucide-react';

const VideoCallPage = () => {
    const { id } = useParams();
    const jitsiContainerRef = useRef(null);
    const [connecting, setConnecting] = useState(true);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => {
            if (!window.JitsiMeetExternalAPI) {
                setConnecting(false);
                return;
            }

            const domain = "meet.jit.si";
            const options = {
                roomName: `MedsZop-Consultation-${id}`,
                width: "100%",
                height: "100%",
                parentNode: jitsiContainerRef.current,
                configOverwrite: {
                    startWithAudioMuted: true,
                    prejoinPageEnabled: false
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'settings', 'raisehand', 'videoquality', 'filmstrip', 'feedback',
                        'tileview', 'download', 'help', 'mute-everyone'
                    ],
                },
            };

            const api = new window.JitsiMeetExternalAPI(domain, options);
            api.addEventListener('videoConferenceJoined', () => {
                setConnecting(false);
            });
            // Fallback timeout to dismiss connecting indicator once iframe settles
            setTimeout(() => setConnecting(false), 3500);
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
                {/* Consultation Room Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <Link to="/consult-doctor">
                            <Button variant="ghost" size="sm" className="rounded-xl h-9 text-xs font-semibold gap-1.5 pl-2 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                                <Video className="h-5 w-5 text-primary" />
                                Telehealth Video Consultation
                            </h1>
                            <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                                Session ID: {id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-3 py-1 rounded-full gap-1.5">
                            <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                            Live Call
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-full border-slate-200 dark:border-slate-800 text-muted-foreground gap-1 hidden sm:inline-flex">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            End-to-End Encrypted
                        </Badge>
                    </div>
                </div>

                {/* Video Container Box */}
                <div className="flex-1 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl relative border border-slate-800 min-h-[460px] sm:min-h-[580px] h-[calc(100dvh-150px)] max-h-[860px] flex flex-col">
                    {connecting && (
                        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
                            <div className="p-4 rounded-full bg-primary/20 text-primary border border-primary/30">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-heading font-bold text-lg text-white">Connecting Secure Bridge</h3>
                                <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
                                    Establishing encrypted peer connection. Please grant camera and microphone permissions when prompted.
                                </p>
                            </div>
                        </div>
                    )}

                    <div ref={jitsiContainerRef} className="w-full h-full flex-1" />
                </div>
            </main>
        </div>
    );
};

export default VideoCallPage;
