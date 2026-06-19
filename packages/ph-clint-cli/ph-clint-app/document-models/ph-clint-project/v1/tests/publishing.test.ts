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

  describe('BUMP_VERSION', () => {
    it('sets a valid semver version', () => {
      const doc = reducer(utils.createDocument(), bumpVersion({ version: '1.2.3' }));
      expect(doc.operations.global[0].error).toBeUndefined();
      expect(doc.state.global.version).toBe('1.2.3');
    });

    it('accepts prerelease and build metadata', () => {
      const doc = reducer(utils.createDocument(), bumpVersion({ version: '1.0.0-dev.90+build.1' }));
      expect(doc.operations.global[0].error).toBeUndefined();
      expect(doc.state.global.version).toBe('1.0.0-dev.90+build.1');
    });

    it('rejects an invalid version', () => {
      const doc = reducer(utils.createDocument(), bumpVersion({ version: 'not-a-version' }));
      expect(doc.operations.global[0].error).toContain('Invalid version');
    });
  });

  describe('PUBLISH_DEV / PUBLISH_STAGING / PUBLISH_PRODUCTION', () => {
    it('appends a pending Dev record with the current version', () => {
      let doc = reducer(utils.createDocument(), bumpVersion({ version: '2.0.0' }));
      doc = reducer(doc, publishDev({ id: 'pub-dev', timestamp: '2026-01-01T00:00:00.000Z' }));
      const record = doc.state.global.publishHistory.find((r) => r.id === 'pub-dev')!;
      expect(record).toEqual({
        id: 'pub-dev',
        tag: 'Dev',
        version: '2.0.0',
        timestamp: '2026-01-01T00:00:00.000Z',
        status: 'Pending',
      });
    });

    it('appends a pending Staging record', () => {
      const doc = reducer(utils.createDocument(), publishStaging({ id: 'pub-stg', timestamp: '2026-01-01T00:00:00.000Z' }));
      const record = doc.state.global.publishHistory.find((r) => r.id === 'pub-stg')!;
      expect(record.tag).toBe('Staging');
      expect(record.status).toBe('Pending');
    });

    it('appends a pending Production record', () => {
      const doc = reducer(utils.createDocument(), publishProduction({ id: 'pub-prod', timestamp: '2026-01-01T00:00:00.000Z' }));
      const record = doc.state.global.publishHistory.find((r) => r.id === 'pub-prod')!;
      expect(record.tag).toBe('Production');
      expect(record.status).toBe('Pending');
    });
  });

  describe('SET_PUBLISH_STATUS', () => {
    it('updates the status of an existing record', () => {
      let doc = reducer(utils.createDocument(), publishDev({ id: 'pub-1', timestamp: '2026-01-01T00:00:00.000Z' }));
      doc = reducer(doc, setPublishStatus({ id: 'pub-1', status: 'Succeeded' }));
      const record = doc.state.global.publishHistory.find((r) => r.id === 'pub-1')!;
      expect(doc.operations.global[1].error).toBeUndefined();
      expect(record.status).toBe('Succeeded');
    });

    it('rejects setting status on a missing record', () => {
      const doc = reducer(utils.createDocument(), setPublishStatus({ id: 'missing', status: 'Failed' }));
      expect(doc.operations.global[0].error).toContain('Publish record not found');
    });
  });
});
