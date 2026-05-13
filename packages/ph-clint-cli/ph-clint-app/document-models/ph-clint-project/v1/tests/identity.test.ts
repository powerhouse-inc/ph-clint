import { describe, expect, it } from 'vitest';
import { reducer, utils, isPhClintProjectDocument, setVersion, setDescription, setPackageIdentifier } from 'document-models/ph-clint-project/v1';

describe('IdentityOperations', () => {
  it('should set a valid semver version', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setVersion({ version: '1.2.3' }));

    expect(updatedDocument.state.global.version).toBe('1.2.3');
    expect(updatedDocument.operations.global[0].error).toBeUndefined();
  });

  it('should set description', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setDescription({ description: 'A CLI tool for testing' }));

    expect(updatedDocument.state.global.description).toBe('A CLI tool for testing');
    expect(updatedDocument.operations.global[0].error).toBeUndefined();
  });

  it('should parse @scope/name-cli correctly', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: '@myorg/my-tool-cli' }));

    expect(updatedDocument.state.global.scope).toBe('@myorg');
    expect(updatedDocument.state.global.name).toBe('my-tool-cli');
    expect(updatedDocument.operations.global[0].error).toBeUndefined();
  });

  it('should auto-add -cli suffix when missing', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: 'my-tool' }));

    expect(updatedDocument.state.global.scope).toBeNull();
    expect(updatedDocument.state.global.name).toBe('my-tool-cli');
  });

  it('should auto-add @ prefix to scope and -cli suffix', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: 'myorg/my-tool' }));

    expect(updatedDocument.state.global.scope).toBe('@myorg');
    expect(updatedDocument.state.global.name).toBe('my-tool-cli');
  });

  it('should set scope to null for unscoped package', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: 'my-tool-cli' }));

    expect(updatedDocument.state.global.scope).toBeNull();
    expect(updatedDocument.state.global.name).toBe('my-tool-cli');
  });

  it('should error on empty identifier', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: '' }));

    expect(updatedDocument.operations.global[0].error).toBe('Package identifier must not be empty');
    expect(updatedDocument.state.global.name).toBeNull();
  });

  it('should error on whitespace-only identifier', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: '   ' }));

    expect(updatedDocument.operations.global[0].error).toBe('Package identifier must not be empty');
  });

  it('should error on uppercase characters', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: 'MyTool' }));

    expect(updatedDocument.operations.global[0].error).toContain('Invalid package name');
  });

  it('should error on just @ character', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: '@' }));

    expect(updatedDocument.operations.global[0].error).toBeDefined();
  });

  it('should error on just / character', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setPackageIdentifier({ identifier: '/' }));

    expect(updatedDocument.operations.global[0].error).toBeDefined();
  });

  it('should error on invalid version', () => {
    const document = utils.createDocument();
    const updatedDocument = reducer(document, setVersion({ version: 'not-semver' }));

    expect(updatedDocument.operations.global[0].error).toBe('Invalid version: not-semver');
  });

  it('should dispatch setPackageIdentifier with correct action type', () => {
    const document = utils.createDocument();
    const input = { identifier: '@myorg/test-cli' };

    const updatedDocument = reducer(document, setPackageIdentifier(input));

    expect(isPhClintProjectDocument(updatedDocument)).toBe(true);
    expect(updatedDocument.operations.global).toHaveLength(1);
    expect(updatedDocument.operations.global[0].action.type).toBe('SET_PACKAGE_IDENTIFIER');
    expect(updatedDocument.operations.global[0].action.input).toStrictEqual(input);
    expect(updatedDocument.operations.global[0].index).toEqual(0);
  });
});
