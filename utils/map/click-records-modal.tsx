import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/utils/location";

interface ClickRecordsModalProps {
  records: Array<{
    lat: number;
    lng: number;
    timestamp: number;
  }>;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export function ClickRecordsModal({ records, onClose, onSave }: ClickRecordsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Clicked Locations ({records.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        <div className="space-y-2 mb-4">
          {records.map((record, index) => (
            <div key={index} className="flex justify-between border-b py-2">
              <div className="text-black">
                {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
              </div>
              <div className="text-gray-500">
                {formatTimestamp(record.timestamp)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onSave}>
            Save To Database
          </Button>
        </div>
      </div>
    </div>
  );
} 