"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Ticket, Clock, MapPin, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tokensApi } from "@/lib/api";
import { Token, TokenStatus } from "@/types";
import { formatDate, formatDateTime, getStatusColor } from "@/lib/utils";
import { connectSocket, subscribeToToken, onTokenCalled, onPositionUpdate } from "@/lib/socket";
import { useQueueStore } from "@/store/queue.store";
import { useAppStore } from "@/store/app.store";

export default function TokensPage() {
  const { setCurrentToken, setPosition } = useQueueStore();
  const { addNotification } = useAppStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["myTokens"],
    queryFn: () => tokensApi.getMy({ limit: 20 }),
    refetchInterval: 30000,
  });

  const tokens: Token[] = data?.data?.data?.data || [];
  const activeToken = tokens.find(
    (t) => t.status === TokenStatus.WAITING || t.status === TokenStatus.CALLED || t.status === TokenStatus.IN_SERVICE
  );

  const { data: positionData } = useQuery({
    queryKey: ["tokenPosition", activeToken?.id],
    queryFn: () => tokensApi.getPosition(activeToken!.id),
    enabled: !!activeToken && activeToken.status === TokenStatus.WAITING,
    refetchInterval: 15000,
  });

  const position = positionData?.data?.data?.position;

  useEffect(() => {
    if (!activeToken) return;

    const socket = connectSocket();
    subscribeToToken(activeToken.id);

    const unsubCalled = onTokenCalled((data) => {
      if (data.tokenId === activeToken.id) {
        addNotification({
          title: "Your Token is Called!",
          message: `Token ${data.tokenNumber} — please proceed to Counter ${data.counterNumber}`,
          type: "success",
        });
        refetch();
      }
    });

    const unsubPosition = onPositionUpdate((data) => {
      setPosition(data.position);
    });

    return () => {
      unsubCalled();
      unsubPosition();
    };
  }, [activeToken?.id]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Tokens</h1>
        <p className="text-muted-foreground text-sm">Your digital queue tokens</p>
      </div>

      {/* Active Token Card */}
      {activeToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`border-2 ${activeToken.status === TokenStatus.CALLED ? "border-primary animate-pulse-slow" : "border-primary/50"}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Active Token
                </CardTitle>
                <Badge className={getStatusColor(activeToken.status)}>{activeToken.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activeToken.status === TokenStatus.CALLED && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg p-4 mb-6"
                >
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Your turn! Please proceed immediately.</p>
                    <p className="text-sm opacity-90">Counter {activeToken.counterNumber} is waiting for you</p>
                  </div>
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG value={activeToken.qrData || activeToken.id} size={160} />
                  </div>
                  <p className="text-xs text-muted-foreground">Scan at counter for verification</p>
                </div>

                {/* Token Details */}
                <div className="space-y-4">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Token Number</p>
                    <p className="text-5xl font-black text-primary">{activeToken.tokenNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Service</p>
                      <p className="text-sm font-medium">{activeToken.service?.name || "N/A"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Priority</p>
                      <p className="text-sm font-medium">{activeToken.priority}</p>
                    </div>
                  </div>

                  {activeToken.status === TokenStatus.WAITING && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Queue Position
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">{position ?? "..."}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Est. Wait</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {activeToken.estimatedWaitTime ?? "..."} min
                        </p>
                      </div>
                    </div>
                  )}

                  {activeToken.status === TokenStatus.CALLED && activeToken.counterNumber && (
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Proceed to</p>
                      <p className="text-2xl font-bold text-primary">Counter {activeToken.counterNumber}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {activeToken.office?.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Token History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16"/>)}
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tokens generated yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{token.tokenNumber}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.service?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(token.createdAt)}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(token.status)}>{token.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
