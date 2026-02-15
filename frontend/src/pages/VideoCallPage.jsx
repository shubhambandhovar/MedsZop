import { useParams } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';

const VideoCallPage = () => {
    const { id } = useParams();
    const jitsiContainerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => {
            if (!window.JitsiMeetExternalAPI) return;

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
            // eslint-disable-next-line no-unused-vars
            const api = new window.JitsiMeetExternalAPI(domain, options);
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto py-8 px-4">
                <div className="bg-white p-4 rounded-xl shadow-lg h-[750px] flex flex-col">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800">Video Consultation</h2>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                        <div ref={jitsiContainerRef} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallPage;
