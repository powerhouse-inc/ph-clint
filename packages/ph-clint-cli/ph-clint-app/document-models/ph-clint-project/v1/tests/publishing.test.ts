import { generateMock } from 'document-model';
import {
  bumpVersion,
  BumpVersionInputSchema,
  isPhClintProjectDocument,
  publishDev,
  PublishDevInputSchema,
  publishProduction,
  PublishProductionInputSchema,
  publishStaging,
  PublishStagingInputSchema,
  reducer,
  setPublishStatus,
  SetPublishStatusInputSchema,
  utils,
} from 'document-models/ph-clint-project/v1';
import { describe, expect, it } from 'vitest';

describe('PublishingOperations', () => {
  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle bumpVersion operation', () => {
    const document = utils.createDocument();
    const input = generateMock(BumpVersionInputSchema());

    const updatedDocument = reducer(document, bumpVersion(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('BUMP_VERSION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishDev operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishDevInputSchema());

    const updatedDocument = reducer(document, publishDev(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_DEV');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishStaging operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishStagingInputSchema());

    const updatedDocument = reducer(document, publishStaging(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_STAGING');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle publishProduction operation', () => {
    const document = utils.createDocument();
    const input = generateMock(PublishProductionInputSchema());

    const updatedDocument = reducer(document, publishProduction(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('PUBLISH_PRODUCTION');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });

  it('should handle setPublishStatus operation', () => {
    const document = utils.createDocument();
    const input = generateMock(SetPublishStatusInputSchema());

    const updatedDocument = reducer(document, setPublishStatus(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PUBLISH_STATUS');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
