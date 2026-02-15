import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportText: string | null;
}

export function InsightDialog({ open, onOpenChange, reportText }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col" id="insight-modal">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Transit Insight Report</DialogTitle>
        </DialogHeader>
        <div id="insight-report-content" className="overflow-y-auto flex-1 text-sm whitespace-pre-wrap font-mono leading-relaxed p-4">
          {reportText}
        </div>
      </DialogContent>
    </Dialog>
  );
}
