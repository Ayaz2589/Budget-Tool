export type TourStepAction = {
  clickSelector?: string;
  navigateTo?: string;
  delayMs?: number;
};

export type TourStepInput = {
  target?: string;
  titleKey?: string;
  contentKey?: string;
  title?: string;
  content?: string;
  onNextAction?: TourStepAction;
  waitMs?: number;
};

export interface PageTourTriggerProps {
  pageId: string;
  steps: TourStepInput[];
}
