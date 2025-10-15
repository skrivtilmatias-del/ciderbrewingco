import { Smartphone, Wifi, Download, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Install = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Install CiderTrack</h1>
          <p className="text-xl text-muted-foreground">
            Get the full app experience with offline support
          </p>
        </div>

        {isStandalone && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              CiderTrack is already installed! You can close this page and use the app from your home screen.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>iOS (iPhone/iPad)</CardTitle>
              <CardDescription>Install from Safari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open this page in Safari browser</li>
                <li>Tap the Share button (square with arrow up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>CiderTrack will appear on your home screen</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Android</CardTitle>
              <CardDescription>Install from Chrome</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open this page in Chrome browser</li>
                <li>Tap the three dots menu (⋮) in the top right</li>
                <li>Tap "Install app" or "Add to Home screen"</li>
                <li>Tap "Install" in the prompt</li>
                <li>CiderTrack will appear on your home screen</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Desktop</CardTitle>
              <CardDescription>Install on Windows, Mac, or Linux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open this page in Chrome, Edge, or Brave</li>
                <li>Look for the install icon in the address bar</li>
                <li>Click "Install" in the prompt</li>
                <li>CiderTrack will open as a standalone app</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Wifi className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Offline Support</CardTitle>
              <CardDescription>Works without internet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Browse all your data without internet</li>
                <li>Create and edit tasting notes offline</li>
                <li>Modify floor plans when disconnected</li>
                <li>Changes sync automatically when back online</li>
                <li>See pending sync status in the banner</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benefits of Installing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Launch from home screen like a native app</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Full-screen experience without browser UI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Faster loading with cached assets</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Works offline in the cellar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Automatic background updates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <span className="text-sm">Reduced data usage</span>
              </li>
            </ul>
          </CardContent>
        </Card>
    </div>
  );
};

export default Install;
