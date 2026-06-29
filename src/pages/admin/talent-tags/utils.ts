export type TTalentTag = {
  id: number;
  candidate_id: number;
  talent_id: number;
  facet: string;
  value: string;
  created_at: string;
};

export type TFacetConfig = {
  key: string;
  label: string;
  hierarchical: boolean;
  maxLevels?: number;
};

export const TALENT_TAG_FACETS: TFacetConfig[] = [
  { key: "function", label: "Function", hierarchical: true, maxLevels: 3 },
  { key: "industry", label: "Industry", hierarchical: true, maxLevels: 2 },
  { key: "seniority", label: "Seniority", hierarchical: false },
  { key: "skills", label: "Skills", hierarchical: false },
  { key: "location", label: "Location", hierarchical: true, maxLevels: 2 },
  { key: "functional_style", label: "Functional Style", hierarchical: false },
  { key: "salary_range", label: "Salary Range", hierarchical: true, maxLevels: 2 },
  {
    key: "work_authorization",
    label: "Work Authorization",
    hierarchical: true,
    maxLevels: 2,
  },
];

export type TDistributionRow = {
  key: string;
  count: number;
};

export function formatTagLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getGroupKey(
  value: string,
  hierarchical: boolean,
  level1Filter: string | null,
): string | null {
  if (!hierarchical) {
    return value;
  }

  const parts = value.split("::");
  if (!level1Filter) {
    return parts[0] || value;
  }

  if (parts[0] !== level1Filter) {
    return null;
  }

  if (parts.length === 1) {
    return "(self)";
  }

  return parts.slice(1).join("::");
}

export function buildDistributionRows(
  tags: TTalentTag[],
  facet: string,
  hierarchical: boolean,
  level1Filter: string | null,
): TDistributionRow[] {
  const groupToTalents = new Map<string, Set<number>>();

  for (const tag of tags) {
    if (tag.facet !== facet) {
      continue;
    }

    const groupKey = getGroupKey(tag.value, hierarchical, level1Filter);
    if (!groupKey) {
      continue;
    }

    if (!groupToTalents.has(groupKey)) {
      groupToTalents.set(groupKey, new Set());
    }
    groupToTalents.get(groupKey)!.add(tag.talent_id);
  }

  return Array.from(groupToTalents.entries())
    .map(([key, talents]) => ({ key, count: talents.size }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function getLevel1Options(
  tags: TTalentTag[],
  facet: string,
): { label: string; value: string }[] {
  const values = new Set<string>();

  for (const tag of tags) {
    if (tag.facet !== facet) {
      continue;
    }
    const level1 = tag.value.split("::")[0];
    if (level1) {
      values.add(level1);
    }
  }

  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: formatTagLabel(value),
    }));
}

export function getFacetValueOptions(
  tags: TTalentTag[],
  facet: string,
): { label: string; value: string }[] {
  const values = new Set<string>();

  for (const tag of tags) {
    if (tag.facet === facet) {
      values.add(tag.value);
    }
  }

  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: formatTagLabel(value),
    }));
}

export function getHierarchicalLevelOptions(
  tags: TTalentTag[],
  facet: string,
  levelIndex: number,
  parentLevels: (string | null)[],
): { label: string; value: string }[] {
  const parentPath = parentLevels
    .slice(0, levelIndex)
    .filter((level): level is string => !!level)
    .join("::");
  const values = new Set<string>();

  for (const tag of tags) {
    if (tag.facet !== facet) {
      continue;
    }

    const parts = tag.value.split("::");
    if (levelIndex > 0 && parts.slice(0, levelIndex).join("::") !== parentPath) {
      continue;
    }

    if (parts.length > levelIndex) {
      values.add(parts[levelIndex]);
    }
  }

  return Array.from(values)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: formatTagLabel(value),
    }));
}

function buildPathFromLevels(levels: (string | null)[]): string | null {
  const selected = levels.filter((level): level is string => !!level);
  if (selected.length === 0) {
    return null;
  }
  return selected.join("::");
}

function tagMatchesHierarchicalFilter(
  tagValue: string,
  levels: (string | null)[],
): boolean {
  const path = buildPathFromLevels(levels);
  if (!path) {
    return false;
  }
  return tagValue === path || tagValue.startsWith(`${path}::`);
}

function intersectTalentSets(
  current: Set<number> | null,
  next: Set<number>,
): Set<number> {
  if (current === null) {
    return next;
  }
  return new Set([...current].filter((id) => next.has(id)));
}

export function countFilteredTalents(
  tags: TTalentTag[],
  flatFilters: Record<string, string[]>,
  hierarchicalFilters: Record<string, (string | null)[]>,
): number {
  const hasFlatFilter = Object.values(flatFilters).some(
    (values) => values.length > 0,
  );
  const hasHierarchicalFilter = Object.values(hierarchicalFilters).some(
    (levels) => levels.some((level) => !!level),
  );

  if (!hasFlatFilter && !hasHierarchicalFilter) {
    return new Set(tags.map((tag) => tag.talent_id)).size;
  }

  let result: Set<number> | null = null;

  for (const [facet, values] of Object.entries(flatFilters)) {
    if (!values.length) {
      continue;
    }

    const matching = new Set<number>();
    for (const tag of tags) {
      if (tag.facet === facet && values.includes(tag.value)) {
        matching.add(tag.talent_id);
      }
    }
    result = intersectTalentSets(result, matching);
  }

  for (const [facet, levels] of Object.entries(hierarchicalFilters)) {
    if (!levels.some((level) => !!level)) {
      continue;
    }

    const matching = new Set<number>();
    for (const tag of tags) {
      if (
        tag.facet === facet &&
        tagMatchesHierarchicalFilter(tag.value, levels)
      ) {
        matching.add(tag.talent_id);
      }
    }
    result = intersectTalentSets(result, matching);
  }

  return result?.size ?? 0;
}
