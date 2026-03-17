/* eslint-disable react-refresh/only-export-components */
import { flipkartShippingLabelsToolDefinition } from '../definitions';
import {
  createShippingLabelClientAction,
  createShippingLabelHydrateFallback,
  createShippingLabelMeta,
  ShippingLabelRoute,
} from '../shared-route';

export const meta = createShippingLabelMeta(
  flipkartShippingLabelsToolDefinition,
);

export const HydrateFallback = createShippingLabelHydrateFallback(
  flipkartShippingLabelsToolDefinition.title,
);

export const clientAction = createShippingLabelClientAction('flipkart');

export default function FlipkartShippingLabelsRoute() {
  return (
    <ShippingLabelRoute
      brand="flipkart"
      title={flipkartShippingLabelsToolDefinition.title}
      description={flipkartShippingLabelsToolDefinition.shortDescription}
    />
  );
}
