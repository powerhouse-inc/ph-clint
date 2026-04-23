import type { DocumentModelModule } from 'document-model';
import { PhClintProject as PhClintProjectV1 } from './ph-clint-project/v1/module.js';

export const documentModels: DocumentModelModule<any>[] = [PhClintProjectV1];
