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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Language, HealthProfile } from '../types';

interface HealthDashboardProps {
  healthProfile: HealthProfile;
  language: Language;
  onBack: () => void;
}

export function HealthDashboard({ healthProfile, language, onBack }: HealthDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats
  const activeMedications = healthProfile.medications.filter(m => m.active).length;
  const upcomingAppointments = healthProfile.appointments.filter(a => a.status === 'upcoming').length;
  const todayReminders = healthProfile.reminders.filter(r => r.active && r.date === new Date().toISOString().split('T')[0]).length;

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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
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

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
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

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
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
                  <Button size="sm" variant="ghost" className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthProfile.reminders
                  .filter(r => r.active && r.date === new Date().toISOString().split('T')[0])
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Add' : 'जोड़ें'}
              </Button>
            </div>
            {healthProfile.medications.filter(m => m.active).map((med) => (
              <Card key={med.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{med.medicineName}</h3>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {med.timing.map((time, idx) => (
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Book' : 'बुक करें'}
              </Button>
            </div>
            {healthProfile.appointments
              .filter(a => a.status === 'upcoming')
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {language === 'en' ? 'Upload' : 'अपलोड करें'}
              </Button>
            </div>
            {healthProfile.labReports.map((report) => (
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
                        {report.results.map((result, idx) => (
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
