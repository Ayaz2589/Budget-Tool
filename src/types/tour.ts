export type TourStepInput = {
  target?: string;
  titleKey: string;
  contentKey: string;
};

export interface PageTourTriggerProps {
  pageId: string;
  steps: TourStepInput[];
}
