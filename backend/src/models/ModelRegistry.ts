import mongoose, { Schema, Document } from "mongoose";

export interface IModelRegistry extends Document {
  modelKey: string;
  name: string;
  version: string;
  modality: string;
  license: string;
  source: string;
  architecture: string;
  isAvailable: boolean;
  status: string;
  falsePositiveRate: number;
  falseNegativeRate: number;
  description: string;
  limitations: string;
  inputFormat: string;
  lastHealthCheck?: Date;
  updatedAt: Date;
}

const ModelRegistrySchema = new Schema<IModelRegistry>(
  {
    modelKey: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    modality: { type: String, required: true, index: true },
    license: { type: String, required: true },
    source: { type: String, required: true },
    architecture: { type: String, required: true },
    isAvailable: { type: Boolean, default: true, index: true },
    status: { type: String, default: "ready" },
    falsePositiveRate: { type: Number, required: true },
    falseNegativeRate: { type: Number, required: true },
    description: { type: String, required: true },
    limitations: { type: String, required: true },
    inputFormat: { type: String, required: true },
    lastHealthCheck: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ModelRegistry = mongoose.model<IModelRegistry>("ModelRegistry", ModelRegistrySchema);
