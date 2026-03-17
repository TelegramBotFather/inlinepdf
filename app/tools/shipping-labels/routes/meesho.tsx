/* eslint-disable react-refresh/only-export-components */
import { meeshoShippingLabelsToolDefinition } from '../definitions';
import {
  createShippingLabelClientAction,
  createShippingLabelHydrateFallback,
  createShippingLabelMeta,
  ShippingLabelRoute,
} from '../shared-route';

export const meta = createShippingLabelMeta(meeshoShippingLabelsToolDefinition);

export const HydrateFallback = createShippingLabelHydrateFallback(
  meeshoShippingLabelsToolDefinition.title,
);

export const clientAction = createShippingLabelClientAction('meesho');

export default function MeeshoShippingLabelsRoute() {
  return (
    <ShippingLabelRoute
      brand="meesho"
      title={meeshoShippingLabelsToolDefinition.title}
      description={meeshoShippingLabelsToolDefinition.shortDescription}
    />
  );
}
