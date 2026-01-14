import { useState } from 'react';
import { 
  Calendar, 
  Pill, 
  Activity, 
  FileText, 
  Clock, 
  Plus, 
  Bell,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Language, HealthProfile } from '../types';
import { toast } from 'sonner';

interface HealthDashboardProps {
  healthProfile: HealthProfile;
  language: Language;
  onBack: () => void;
}

export function HealthDashboard({ healthProfile, language, onBack }: HealthDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [showUploadReport, setShowUploadReport] = useState(false);

  // Form states
  const [reminderForm, setReminderForm] = useState({ title: '', time: '', description: '' });
  const [medicationForm, setMedicationForm] = useState({ name: '', dosage: '', frequency: '' });
  const [appointmentForm, setAppointmentForm] = useState({ title: '', doctorName: '', date: '', time: '' });
  const [reportForm, setReportForm] = useState({ testName: '', fileName: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Local state for newly added items
  const [addedReminders, setAddedReminders] = useState<any[]>([]);
  const [addedMedications, setAddedMedications] = useState<any[]>([]);
  const [addedAppointments, setAddedAppointments] = useState<any[]>([]);
  const [addedReports, setAddedReports] = useState<any[]>([]);

  // Calculate stats
  const activeMedications = healthProfile.medications.filter(m => m.active).length;
  const upcomingAppointments = healthProfile.appointments.filter(a => a.status === 'upcoming').length;
  const todayReminders = healthProfile.reminders.filter(r => r.active && r.date === new Date().toISOString().split('T')[0]).length;

  // Handler functions
  const handleAddReminder = () => {
    if (reminderForm.title && reminderForm.time) {
      const newReminder = {
        id: Date.now().toString(),
        title: reminderForm.title,
        description: reminderForm.description,
        time: reminderForm.time,
        date: new Date().toISOString().split('T')[0],
        active: true
      };
      setAddedReminders([...addedReminders, newReminder]);
      toast.success(language === 'en' ? 'Reminder added successfully!' : 'अनुस्मारक जोड़ा गया!');
      setReminderForm({ title: '', time: '', description: '' });
      setShowAddReminder(false);
    } else {
      toast.error(language === 'en' ? 'Please fill all fields' : 'कृपया सभी फील्ड भरें');
    }
  };

  const handleAddMedication = () => {
    if (medicationForm.name && medicationForm.dosage && medicationForm.frequency) {
      const newMedication = {
        id: Date.now().toString(),
        medicineName: medicationForm.name,
        dosage: medicationForm.dosage,
        frequency: medicationForm.frequency,
        timing: ['9:00 AM'],
        active: true,
        notes: ''
      };
      setAddedMedications([...addedMedications, newMedication]);
      toast.success(language === 'en' ? 'Medication added successfully!' : 'दवा जोड़ी गई!');
      setMedicationForm({ name: '', dosage: '', frequency: '' });
      setShowAddMedication(false);
    } else {
      toast.error(language === 'en' ? 'Please fill all fields' : 'कृपया सभी फील्ड भरें');
    }
  };

  const handleBookAppointment = () => {
    if (appointmentForm.title && appointmentForm.date && appointmentForm.time) {
      const newAppointment = {
        id: Date.now().toString(),
        title: appointmentForm.title,
        doctorName: appointmentForm.doctorName,
        date: appointmentForm.date,
        time: appointmentForm.time,
        status: 'upcoming',
        type: 'doctor',
        location: 'Clinic'
      };
      setAddedAppointments([...addedAppointments, newAppointment]);
      toast.success(language === 'en' ? 'Appointment booked successfully!' : 'अपॉइंटमेंट बुक किया गया!');
      setAppointmentForm({ title: '', doctorName: '', date: '', time: '' });
      setShowBookAppointment(false);
    } else {
      toast.error(language === 'en' ? 'Please fill all fields' : 'कृपया सभी फील्ड भरें');
    }
  };

  const handleUploadReport = () => {
    if (reportForm.testName && selectedFile) {
      const newReport = {
        id: Date.now().toString(),
        testName: reportForm.testName,
        labName: 'Uploaded',
        date: new Date().toISOString(),
        fileName: selectedFile.name,
        results: [{ parameter: 'File', value: selectedFile.name, status: 'normal' }]
      };
      setAddedReports([...addedReports, newReport]);
      toast.success(language === 'en' ? 'Report uploaded successfully!' : 'रिपोर्ट अपलोड की गई!');
      setReportForm({ testName: '', fileName: '' });
      setSelectedFile(null);
      setShowUploadReport(false);
    } else {
      toast.error(language === 'en' ? 'Please fill all fields and select a file' : 'कृपया सभी फील्ड भरें और फाइल चुनें');
    }
  };

  // Health metrics for charts
  const bpData = healthProfile.healthMetrics
    .filter(m => m.type === 'bloodPressure')
    .slice(-7)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      systolic: parseInt(m.value.split('/')[0]),
      diastolic: parseInt(m.value.split('/')[1])
    }));

  const sugarData = healthProfile.healthMetrics
    .filter(m => m.type === 'bloodSugar')
    .slice(-7)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseInt(m.value)
    }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {language === 'en' ? 'Health Dashboard' : 'स्वास्थ्य डैशबोर्ड'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Your Personal Health Assistant' : 'आपका व्यक्तिगत स्वास्थ्य सहायक'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setActiveTab('medications'); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{activeMedications}</p>
                  <p className="text-xs opacity-90">
                    {language === 'en' ? 'Active Meds' : 'सक्रिय दवाएं'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setActiveTab('appointments'); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{upcomingAppointments}</p>
                  <p className="text-xs opacity-90">
                    {language === 'en' ? 'Appointments' : 'अपॉइंटमेंट'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setActiveTab('overview'); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{todayReminders}</p>
                  <p className="text-xs opacity-90">
                    {language === 'en' ? 'Today' : 'आज'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview">
              {language === 'en' ? 'Overview' : 'अवलोकन'}
            </TabsTrigger>
            <TabsTrigger value="medications">
              {language === 'en' ? 'Meds' : 'दवाएं'}
            </TabsTrigger>
            <TabsTrigger value="appointments">
              {language === 'en' ? 'Visits' : 'मुलाकात'}
            </TabsTrigger>
            <TabsTrigger value="reports">
              {language === 'en' ? 'Reports' : 'रिपोर्ट'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Today's Reminders */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'en' ? "Today's Reminders" : 'आज के अनुस्मारक'}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 hover:bg-gray-100"
                    onClick={() => setShowAddReminder(!showAddReminder)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {showAddReminder && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium">{language === 'en' ? 'Reminder Title' : 'अनुस्मारक शीर्षक'}</label>
                      <Input
                        placeholder={language === 'en' ? 'e.g., Take Medicine' : 'उदा. दवा लें'}
                        value={reminderForm.title}
                        onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{language === 'en' ? 'Time' : 'समय'}</label>
                      <Input
                        type="time"
                        value={reminderForm.time}
                        onChange={(e) => setReminderForm({...reminderForm, time: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{language === 'en' ? 'Description' : 'विवरण'}</label>
                      <Input
                        placeholder={language === 'en' ? 'Optional details' : 'वैकल्पिक विवरण'}
                        value={reminderForm.description}
                        onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleAddReminder}
                      >
                        {language === 'en' ? 'Add Reminder' : 'अनुस्मारक जोड़ें'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddReminder(false);
                          setReminderForm({ title: '', time: '', description: '' });
                        }}
                      >
                        {language === 'en' ? 'Cancel' : 'रद्द करें'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {[...addedReminders, ...healthProfile.reminders
                  .filter(r => r.active && r.date === new Date().toISOString().split('T')[0])]
                  .map((reminder) => (
                    <div key={reminder.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                      </div>
                      <Badge variant="outline">{reminder.time}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Health Metrics Charts */}
            {bpData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'en' ? 'Blood Pressure Trend' : 'रक्तचाप प्रवृत्ति'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={bpData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" strokeWidth={2} />
                      <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {sugarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'en' ? 'Blood Sugar Levels' : 'रक्त शर्करा स्तर'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sugarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" name="Sugar (mg/dL)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Medical History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {language === 'en' ? 'Medical History' : 'चिकित्सा इतिहास'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthProfile.medicalHistory.map((history) => (
                  <div key={history.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      history.status === 'active' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <Activity className={`h-5 w-5 ${
                        history.status === 'active' ? 'text-orange-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{history.condition}</p>
                        <Badge variant={history.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {history.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Diagnosed' : 'निदान'}: {new Date(history.diagnosedDate).toLocaleDateString()}
                      </p>
                      {history.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Health Tips */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base">
                    {language === 'en' ? 'Health Tips' : 'स्वास्थ्य सुझाव'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>{language === 'en' ? 'Take medications on time for better results' : 'बेहतर परिणामों के लिए समय पर दवाएं लें'}</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>{language === 'en' ? 'Monitor your blood pressure regularly' : 'नियमित रूप से अपने रक्तचाप की निगरानी करें'}</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>{language === 'en' ? 'Stay hydrated and maintain a balanced diet' : 'हाइड्रेटेड रहें और संतुलित आहार बनाए रखें'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {language === 'en' ? 'Current Medications' : 'वर्तमान दवाएं'}
              </h2>
              <Button 
                size="sm"
                onClick={() => setShowAddMedication(!showAddMedication)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Add' : 'जोड़ें'}
              </Button>
            </div>
            {showAddMedication && (
              <Card className="bg-blue-50 border-blue-200 mb-4">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Medicine Name' : 'दवा का नाम'}</label>
                    <Input
                      placeholder={language === 'en' ? 'e.g., Paracetamol' : 'उदा. पेरासिटामोल'}
                      value={medicationForm.name}
                      onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Dosage' : 'खुराक'}</label>
                    <Input
                      placeholder={language === 'en' ? 'e.g., 500mg' : 'उदा. 500mg'}
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Frequency' : 'आवृत्ति'}</label>
                    <Input
                      placeholder={language === 'en' ? 'e.g., Twice daily' : 'उदा. दिन में दो बार'}
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleAddMedication}
                    >
                      {language === 'en' ? 'Add Medication' : 'दवा जोड़ें'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddMedication(false);
                        setMedicationForm({ name: '', dosage: '', frequency: '' });
                      }}
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {[...addedMedications, ...healthProfile.medications.filter(m => m.active)].map((med) => (
              <Card key={med.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{med.medicineName}</h3>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {med.timing.map((time: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {time}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {med.frequency} • {language === 'en' ? 'Until' : 'तक'} {med.endDate || 'Ongoing'}
                      </p>
                    </div>
                    <Pill className="h-8 w-8 text-blue-500" />
                  </div>
                  {med.notes && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-2">
                      <p className="text-xs text-blue-800">{med.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {language === 'en' ? 'Upcoming Appointments' : 'आगामी अपॉइंटमेंट'}
              </h2>
              <Button 
                size="sm"
                onClick={() => setShowBookAppointment(!showBookAppointment)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Book' : 'बुक करें'}
              </Button>
            </div>
            {showBookAppointment && (
              <Card className="bg-green-50 border-green-200 mb-4">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Appointment Type' : 'अपॉइंटमेंट का प्रकार'}</label>
                    <Input
                      placeholder={language === 'en' ? 'e.g., Doctor Consultation' : 'उदा. डॉक्टर परामर्श'}
                      value={appointmentForm.title}
                      onChange={(e) => setAppointmentForm({...appointmentForm, title: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Doctor Name' : 'डॉक्टर का नाम'}</label>
                    <Input
                      placeholder={language === 'en' ? 'Optional' : 'वैकल्पिक'}
                      value={appointmentForm.doctorName}
                      onChange={(e) => setAppointmentForm({...appointmentForm, doctorName: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Date' : 'तारीख'}</label>
                    <Input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Time' : 'समय'}</label>
                    <Input
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleBookAppointment}
                    >
                      {language === 'en' ? 'Book Appointment' : 'अपॉइंटमेंट बुक करें'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowBookAppointment(false);
                        setAppointmentForm({ title: '', doctorName: '', date: '', time: '' });
                      }}
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {[...addedAppointments, ...healthProfile.appointments
              .filter(a => a.status === 'upcoming')]
              .map((apt) => (
                <Card key={apt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        apt.type === 'doctor' ? 'bg-blue-100' :
                        apt.type === 'lab' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          apt.type === 'doctor' ? 'text-blue-600' :
                          apt.type === 'lab' ? 'text-green-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{apt.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {apt.type}
                          </Badge>
                        </div>
                        {apt.doctorName && (
                          <p className="text-sm text-muted-foreground">{apt.doctorName}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(apt.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{apt.time}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{apt.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {language === 'en' ? 'Lab Reports' : 'लैब रिपोर्ट'}
              </h2>
              <Button 
                size="sm"
                onClick={() => setShowUploadReport(!showUploadReport)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Upload' : 'अपलोड करें'}
              </Button>
            </div>
            {showUploadReport && (
              <Card className="bg-purple-50 border-purple-200 mb-4">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Test Name' : 'परीक्षण का नाम'}</label>
                    <Input
                      placeholder={language === 'en' ? 'e.g., Blood Test' : 'उदा. रक्त परीक्षण'}
                      value={reportForm.testName}
                      onChange={(e) => setReportForm({...reportForm, testName: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'en' ? 'Upload File' : 'फाइल अपलोड करें'}</label>
                    <div className="mt-1">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            setReportForm({...reportForm, fileName: file.name});
                          }
                        }}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-50 file:text-purple-700
                          hover:file:bg-purple-100 cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="mt-2 text-xs text-purple-600">
                          {language === 'en' ? 'Selected: ' : 'चयनित: '}{selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleUploadReport}
                    >
                      {language === 'en' ? 'Upload Report' : 'रिपोर्ट अपलोड करें'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowUploadReport(false);
                        setReportForm({ testName: '', fileName: '' });
                        setSelectedFile(null);
                      }}
                    >
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {[...addedReports, ...healthProfile.labReports].map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{report.testName}</h3>
                      <p className="text-sm text-muted-foreground">{report.labName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.date).toLocaleDateString()}
                      </p>
                      <div className="mt-3 space-y-2">
                        {report.results.map((result: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{result.parameter}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{result.value}</span>
                              {result.status === 'high' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {result.status === 'low' && (
                                <TrendingUp className="h-4 w-4 text-yellow-500 rotate-180" />
                              )}
                              {result.status === 'normal' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
