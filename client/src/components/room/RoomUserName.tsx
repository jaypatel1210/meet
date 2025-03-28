import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NamePopupProps {
  onClose?: () => void;
  onSubmit?: (name: string) => void;
}

const RoomUserName = ({
  onClose = () => {},
  onSubmit = () => {},
}: NamePopupProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
      setName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-md rounded-lg bg-background p-6 shadow-lg animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" id="name-dialog-title">
            Enter Your Name
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Join Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomUserName;
