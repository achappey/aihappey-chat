import React from "react";
import { SamplingCard as SamplingCardComponent } from "aihappey-components";
import { SamplingRequest } from "aihappey-state";

export interface SamplingCardProps {
  notif: SamplingRequest;
}

export const SamplingCard: React.FC<SamplingCardProps> = ({ notif }) => {

  return <SamplingCardComponent request={notif[2]} result={notif[3]} />
};
