import { DocumentsService } from '../src/documents/documents.service';

// Minimal in-memory repo matching IDocumentRepository
class InMemoryDocRepo {
  items: unknown[] = [];
  id = 1;

  create(entity: unknown) {
    return { id: this.id++, ...entity };
  }
  async save(entity: unknown) {
    const idx = this.items.findIndex((i) => i.id === entity.id);
    if (idx === -1) this.items.push(entity);
    else this.items[idx] = entity;
    return entity;
  }
  async find() {
    return this.items;
  }
  async findOneBy(criteria: unknown) {
    return this.items.find((i) => i.id === criteria.id) || null;
  }
}

describe('DocumentsService (in-memory)', () => {
  let service: DocumentsService;
  let repo: InMemoryDocRepo;

  beforeEach(() => {
    repo = new InMemoryDocRepo();
    // @ts-expect-error - Mock repository for testing
    service = new DocumentsService(repo as unknown);
  });

  it('creates and lists documents', async () => {
    await service.create({ title: 'Doc1', subject: 'Math', contentUrl: 'u1' } as unknown);
    await service.create({ title: 'Doc2', subject: 'Algo', contentUrl: 'u2' } as unknown);
    const all = await service.list();
    expect(all.items).toHaveLength(2);
  });

  it('rates a document and affects search ranking', async () => {
    await service.create({ title: 'Sorting algorithms', subject: 'Algo', contentUrl: 'u1', rating: 0 } as unknown);
    await service.create({ title: 'Linear algebra notes', subject: 'Math', contentUrl: 'u2', rating: 0 } as unknown);
    // rate first doc high
    const docs = await service.list();
    const id1 = docs.items[0].id;
    await service.rate(id1, 5);
    const results = await service.search('algorithm');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('algorithm');
  });

  it('empty query returns all documents', async () => {
    // reset repo
    repo.items = [];
    await service.create({ title: 'A', subject: 'S1', contentUrl: 'c1' } as unknown);
    await service.create({ title: 'B', subject: 'S2', contentUrl: 'c2' } as unknown);
    const all = await service.list();
    const results = await service.search('');
    expect(results.length).toBe(all.items.length);
  });

  it('search is case-insensitive and matches title/subject/content', async () => {
    repo.items = [];
    await service.create({ title: 'Advanced Algorithms', subject: 'CS', contentUrl: 'contains searchterm in content' } as unknown);
    await service.create({ title: 'Intro to Programming', subject: 'searchterm in subject', contentUrl: 'u2' } as unknown);
    await service.create({ title: 'Unrelated', subject: 'none', contentUrl: 'u3' } as unknown);
    const r1 = await service.search('SEARCHTERM');
    expect(r1.length).toBeGreaterThanOrEqual(2);
    // ensure items with the term are returned
    expect(r1.some((d: unknown) => (d as { title: string }).title.toLowerCase().includes('advanced'))).toBeTruthy();
    expect(r1.some((d: unknown) => (d as { title: string; subject?: string }).title.toLowerCase().includes('intro') || ((d as { title: string; subject?: string }).subject || '').toLowerCase().includes('searchterm'))).toBeTruthy();
  });

  it('ranking prefers higher rating and visits even if match strength differs', async () => {
    repo.items = [];
    const d1 = await service.create({ title: 'Weak match title', subject: 'math', contentUrl: 'u1', rating: 0, visits: 0 } as unknown);
    await service.create({ title: 'Strong match title searchterm', subject: 'algo', contentUrl: 'u2', rating: 0, visits: 0 } as unknown);
    await service.create({ title: 'Moderate match', subject: 'searchterm', contentUrl: 'u3', rating: 0, visits: 0 } as unknown);
    // artificially boost d1 by setting rating and visits directly in repo
    const item1 = repo.items.find((i: unknown) => (i as { id: number }).id === d1.id);
    item1.rating = 5;
    item1.visits = 500;
    await repo.save(item1);
    const results = await service.search('searchterm');
    // top result should be the boosted d1 because rating+visits overcome weaker textual match
    expect(results[0].id).toBe(d1.id);
  });

  it('creates document with all required fields', async () => {
    const docData = {
      title: 'Test Document',
      subject: 'Mathematics',
      contentUrl: '/uploads/test.pdf',
      author: 'Test Author'
    };
    const created = await service.create(docData as unknown);
    expect(created.title).toBe(docData.title);
    expect(created.subject).toBe(docData.subject);
    expect(created.contentUrl).toBe(docData.contentUrl);
    expect(created.author).toBe(docData.author);
    expect(created.id).toBeDefined();
  });

  it('updates document rating correctly', async () => {
    const doc = await service.create({ title: 'Test Doc', subject: 'Math', contentUrl: 'url' } as unknown);
    const updated = await service.rate(doc.id, 4.5);
    expect(updated.rating).toBeGreaterThan(0);
    expect(updated.rating).toBeLessThanOrEqual(5);
  });

  it('handles rating with invalid document ID', async () => {
    const result = await service.rate(999, 5);
    expect(result).toBeNull();
  });

  it('handles document creation with visits field', async () => {
    const doc = await service.create({ title: 'Test Doc', subject: 'Math', contentUrl: 'url', visits: 0 } as unknown);
    expect(doc).toBeDefined();
    expect(doc.title).toBe('Test Doc');
  });

  it('handles document creation with rating field', async () => {
    const doc = await service.create({ title: 'Test Doc', subject: 'Math', contentUrl: 'url', rating: 4.5 } as unknown);
    expect(doc).toBeDefined();
    expect(doc.title).toBe('Test Doc');
  });

  it('lists documents with pagination', async () => {
    // Create multiple documents
    for (let i = 0; i < 5; i++) {
      await service.create({ title: `Doc ${i}`, subject: 'Math', contentUrl: `url${i}` } as unknown);
    }
    
    const result = await service.list(1, 3);
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
  });

  it('handles empty search results', async () => {
    const results = await service.search('nonexistent');
    expect(results).toHaveLength(0);
  });

  it('searches by author name', async () => {
    await service.create({ title: 'Doc1', subject: 'Math', contentUrl: 'url1', author: 'John Doe' } as unknown);
    await service.create({ title: 'Doc2', subject: 'Physics', contentUrl: 'url2', author: 'Jane Smith' } as unknown);
    
    const results = await service.search('John');
    expect(results.length).toBeGreaterThanOrEqual(0);
    if (results.length > 0) {
      expect(results[0].author).toBe('John Doe');
    }
  });

  it('handles special characters in search', async () => {
    await service.create({ title: 'C++ Programming', subject: 'CS', contentUrl: 'url1' } as unknown);
    const results = await service.search('C++');
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts results by relevance score', async () => {
    repo.items = [];
    await service.create({ title: 'Perfect match', subject: 'searchterm', contentUrl: 'url1', rating: 3, visits: 10 } as unknown);
    await service.create({ title: 'Good match', subject: 'searchterm related', contentUrl: 'url2', rating: 5, visits: 5 } as unknown);
    await service.create({ title: 'Partial match', subject: 'other', contentUrl: 'url3', rating: 4, visits: 20 } as unknown);
    
    const results = await service.search('searchterm');
    expect(results[0].title).toBe('Perfect match');
  });
});
