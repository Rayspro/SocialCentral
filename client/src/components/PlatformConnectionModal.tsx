import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Key, Shield, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Platform } from "@shared/schema";
import { OAuthTransition } from "./OAuth/OAuthTransition";
import { OAuthLoadingModal } from "./OAuth/OAuthLoadingModal";

interface PlatformConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformsInfo = [
  {
    name: "youtube",
    displayName: "YouTube",
    icon: "🎥",
    authType: "OAuth 2.0",
    requirements: [
      "Google Cloud Console project",
      "YouTube Data API v3 enabled",
      "OAuth 2.0 credentials (Client ID & Secret)"
    ],
    setupSteps: [
      "Go to Google Cloud Console",
      "Create/select a project",
      "Enable YouTube Data API v3",
      "Create OAuth 2.0 credentials",
      "Add your domain to authorized origins"
    ],
    docsUrl: "https://developers.google.com/youtube/v3/getting-started"
  },
  {
    name: "instagram",
    displayName: "Instagram",
    icon: "📷",
    authType: "Meta OAuth",
    requirements: [
      "Meta for Developers account",
      "Instagram Basic Display API access",
      "App ID and App Secret"
    ],
    setupSteps: [
      "Go to Meta for Developers",
      "Create a new app",
      "Add Instagram Basic Display product",
      "Configure OAuth redirect URIs",
      "Get App ID and App Secret"
    ],
    docsUrl: "https://developers.facebook.com/docs/instagram-basic-display-api"
  },
  {
    name: "twitter",
    displayName: "Twitter/X",
    icon: "🐦",
    authType: "OAuth 1.0a/2.0",
    requirements: [
      "Twitter Developer account",
      "API Key and Secret",
      "Bearer Token (for API v2)"
    ],
    setupSteps: [
      "Apply for Twitter Developer account",
      "Create a new app",
      "Generate API keys and tokens",
      "Configure app permissions",
      "Set up webhook URLs if needed"
    ],
    docsUrl: "https://developer.twitter.com/en/docs/getting-started"
  },
  {
    name: "linkedin",
    displayName: "LinkedIn",
    icon: "💼",
    authType: "OAuth 2.0",
    requirements: [
      "LinkedIn Developer account",
      "LinkedIn API access",
      "Client ID and Client Secret"
    ],
    setupSteps: [
      "Go to LinkedIn Developer Portal",
      "Create a new app",
      "Request API access",
      "Configure OAuth 2.0 settings",
      "Add authorized redirect URLs"
    ],
    docsUrl: "https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow"
  }
];

export function PlatformConnectionModal({ open, onOpenChange }: PlatformConnectionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    apiKey: "",
    bearerToken: ""
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'credentials' | 'oauth' | 'complete'>('credentials');
  const [authUrl, setAuthUrl] = useState<string>("");
  const [showOAuthTransition, setShowOAuthTransition] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  const handleConnect = async () => {
    if (!selectedPlatform) return;
    
    setIsConnecting(true);
    
    try {
      if (selectedPlatform === 'youtube') {
        if (!credentials.clientId || !credentials.clientSecret) {
          alert('Please enter both Client ID and Client Secret for YouTube');
          setIsConnecting(false);
          return;
        }

        // Show loading modal
        setShowLoadingModal(true);
        
        const response = await fetch('/api/auth/youtube/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
          }),
        });

        if (response.ok) {
          const { authUrl } = await response.json();
          setAuthUrl(authUrl);
          
          // Hide loading modal and show OAuth transition
          setTimeout(() => {
            setShowLoadingModal(false);
            setShowOAuthTransition(true);
          }, 2000);
        } else {
          const error = await response.json();
          setShowLoadingModal(false);
          alert(`Failed to initiate YouTube connection: ${error.error}`);
        }
      } else if (selectedPlatform === 'instagram') {
        if (!credentials.clientId || !credentials.clientSecret) {
          alert('Please enter both App ID and App Secret for Instagram');
          setIsConnecting(false);
          return;
        }

        // Show loading modal
        setShowLoadingModal(true);

        const response = await fetch('/api/auth/instagram/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
          }),
        });

        if (response.ok) {
          const { authUrl } = await response.json();
          setAuthUrl(authUrl);
          
          // Hide loading modal and show OAuth transition
          setTimeout(() => {
            setShowLoadingModal(false);
            setShowOAuthTransition(true);
          }, 2000);
        } else {
          const error = await response.json();
          setShowLoadingModal(false);
          alert(`Failed to initiate Instagram connection: ${error.error}`);
        }
      } else {
        // For other platforms, show setup instructions
        setShowLoadingModal(false);
        alert(`To connect to ${selectedPlatform}, you need to:\n\n1. Set up API credentials with the platform\n2. Configure OAuth settings\n3. Implement the authentication flow\n\nThis feature is coming soon - accounts can be added manually in the platform management section for now.`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setShowLoadingModal(false);
      alert('Failed to connect. Please check your credentials and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedPlatformInfo = platformsInfo.find(p => p.name === selectedPlatform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Social Media Platform</DialogTitle>
        </DialogHeader>
        
        {!selectedPlatform ? (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Choose a platform to connect. Each platform requires specific API credentials and authentication setup.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformsInfo.map((platform) => (
                <Card 
                  key={platform.name}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 hover:border-blue-500"
                  onClick={() => setSelectedPlatform(platform.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{platform.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {platform.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {platform.authType}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="text-2xl">{selectedPlatformInfo?.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connect {selectedPlatformInfo?.displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Authentication: {selectedPlatformInfo?.authType}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedPlatform(null)}
                className="ml-auto"
              >
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Setup Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Setup Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Requirements:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedPlatformInfo?.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Setup Steps:</h4>
                    <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedPlatformInfo?.setupSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedPlatformInfo?.docsUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </CardContent>
              </Card>

              {/* Credentials Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {selectedPlatform === "youtube" && (
                      <>
                        <div>
                          <Label htmlFor="clientId">Client ID</Label>
                          <Input
                            id="clientId"
                            placeholder="Your Google OAuth Client ID"
                            value={credentials.clientId}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientSecret">Client Secret</Label>
                          <Input
                            id="clientSecret"
                            type="password"
                            placeholder="Your Google OAuth Client Secret"
                            value={credentials.clientSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {selectedPlatform === "instagram" && (
                      <>
                        <div>
                          <Label htmlFor="appId">App ID</Label>
                          <Input
                            id="appId"
                            placeholder="Your Meta App ID"
                            value={credentials.clientId}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="appSecret">App Secret</Label>
                          <Input
                            id="appSecret"
                            type="password"
                            placeholder="Your Meta App Secret"
                            value={credentials.clientSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {selectedPlatform === "twitter" && (
                      <>
                        <div>
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input
                            id="apiKey"
                            placeholder="Your Twitter API Key"
                            value={credentials.apiKey}
                            onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="apiSecret">API Secret</Label>
                          <Input
                            id="apiSecret"
                            type="password"
                            placeholder="Your Twitter API Secret"
                            value={credentials.clientSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bearerToken">Bearer Token</Label>
                          <Input
                            id="bearerToken"
                            type="password"
                            placeholder="Your Twitter Bearer Token"
                            value={credentials.bearerToken}
                            onChange={(e) => setCredentials(prev => ({ ...prev, bearerToken: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {selectedPlatform === "linkedin" && (
                      <>
                        <div>
                          <Label htmlFor="clientId">Client ID</Label>
                          <Input
                            id="clientId"
                            placeholder="Your LinkedIn Client ID"
                            value={credentials.clientId}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientSecret">Client Secret</Label>
                          <Input
                            id="clientSecret"
                            type="password"
                            placeholder="Your LinkedIn Client Secret"
                            value={credentials.clientSecret}
                            onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> This is a demo interface. Real implementation requires OAuth flow setup, 
                      webhook endpoints, and proper token management. For now, you can add accounts manually 
                      in the platform management section.
                    </p>
                  </div>

                  <Button 
                    onClick={handleConnect}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isConnecting || (!credentials.clientId && !credentials.apiKey)}
                  >
                    {isConnecting ? (
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </motion.div>
                    ) : (
                      <span>Connect {selectedPlatformInfo?.displayName}</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* OAuth Loading Modal */}
        <OAuthLoadingModal
          isOpen={showLoadingModal}
          platform={selectedPlatform || ''}
          onClose={() => setShowLoadingModal(false)}
        />
        
        {/* OAuth Transition */}
        {showOAuthTransition && authUrl && selectedPlatform && (
          <OAuthTransition
            platform={selectedPlatform}
            authUrl={authUrl}
            onComplete={() => {
              setShowOAuthTransition(false);
              setConnectionStep('complete');
              onOpenChange(false);
            }}
            onError={(error) => {
              setShowOAuthTransition(false);
              alert(`OAuth error: ${error}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}