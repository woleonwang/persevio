import { useEffect, useMemo, useState } from "react";
import { Card, Select, Spin, Statistic, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

import { Get } from "@/utils/request";

import {
  TALENT_TAG_FACETS,
  buildDistributionRows,
  countFilteredTalents,
  formatTagLabel,
  getFacetValueOptions,
  getHierarchicalLevelOptions,
  getLevel1Options,
  type TDistributionRow,
  type TFacetConfig,
  type TTalentTag,
} from "./utils";
import styles from "./style.module.less";

type TFacetCardProps = {
  facet: TFacetConfig;
  tags: TTalentTag[];
};

const distributionColumns: ColumnsType<TDistributionRow> = [
  {
    title: "Value",
    dataIndex: "key",
    key: "key",
    render: (value: string) => formatTagLabel(value),
  },
  {
    title: "Count",
    dataIndex: "count",
    key: "count",
    width: 100,
    render: (value: number) => value.toLocaleString(),
  },
];

function FacetCard({ facet, tags }: TFacetCardProps) {
  const [level1Filter, setLevel1Filter] = useState<string | null>(null);

  const level1Options = useMemo(
    () => getLevel1Options(tags, facet.key),
    [tags, facet.key],
  );

  const tableData = useMemo(
    () =>
      buildDistributionRows(
        tags,
        facet.key,
        facet.hierarchical,
        facet.hierarchical ? level1Filter : null,
      ),
    [tags, facet.key, facet.hierarchical, level1Filter],
  );

  return (
    <Card title={facet.label} className={styles.facetCard} size="small">
      {facet.hierarchical && level1Options.length > 0 && (
        <Select
          className={styles.level1Select}
          allowClear
          placeholder="Filter by level 1"
          options={level1Options}
          value={level1Filter ?? undefined}
          onChange={(value) => setLevel1Filter(value ?? null)}
        />
      )}
      <Table
        size="small"
        columns={distributionColumns}
        dataSource={tableData.map((row) => ({ ...row, key: row.key }))}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
      />
    </Card>
  );
}

type TFacetFilterItemProps = {
  facet: TFacetConfig;
  tags: TTalentTag[];
  flatValues: string[];
  levelValues: (string | null)[];
  onFlatChange: (values: string[]) => void;
  onLevelChange: (levels: (string | null)[]) => void;
};

function FacetFilterItem({
  facet,
  tags,
  flatValues,
  levelValues,
  onFlatChange,
  onLevelChange,
}: TFacetFilterItemProps) {
  if (!facet.hierarchical) {
    return (
      <div className={styles.filterItem}>
        <span className={styles.filterLabel}>{facet.label}</span>
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={`Select ${facet.label.toLowerCase()}`}
          options={getFacetValueOptions(tags, facet.key)}
          value={flatValues}
          onChange={onFlatChange}
        />
      </div>
    );
  }

  const maxLevels = facet.maxLevels ?? 2;

  return (
    <div className={styles.filterItem}>
      <span className={styles.filterLabel}>{facet.label}</span>
      <div className={styles.levelSelectRow}>
        {Array.from({ length: maxLevels }, (_, levelIndex) => {
          const parentLevels = levelValues.slice(0, levelIndex);
          const disabled = levelIndex > 0 && !levelValues[levelIndex - 1];
          const options = disabled
            ? []
            : getHierarchicalLevelOptions(
                tags,
                facet.key,
                levelIndex,
                parentLevels,
              );

          return (
            <Select
              key={levelIndex}
              className={styles.levelSelect}
              allowClear
              showSearch
              disabled={disabled}
              optionFilterProp="label"
              placeholder={`Level ${levelIndex + 1}`}
              options={options}
              value={levelValues[levelIndex] ?? undefined}
              onChange={(value) => {
                const nextLevels = [...levelValues];
                while (nextLevels.length < maxLevels) {
                  nextLevels.push(null);
                }
                nextLevels[levelIndex] = value ?? null;
                for (let i = levelIndex + 1; i < maxLevels; i += 1) {
                  nextLevels[i] = null;
                }
                onLevelChange(nextLevels);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const TalentTagDistribution = () => {
  const [tags, setTags] = useState<TTalentTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [flatFilters, setFlatFilters] = useState<Record<string, string[]>>({});
  const [hierarchicalFilters, setHierarchicalFilters] = useState<
    Record<string, (string | null)[]>
  >({});

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const res = await Get<{ tags: TTalentTag[] }>("/api/admin/talent_tags");
        if (res?.code === 0 && res.data?.tags) {
          setTags(res.data.tags);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const totalTags = tags.length;
  const taggedTalents = useMemo(
    () => new Set(tags.map((tag) => tag.talent_id)).size,
    [tags],
  );
  const filteredCount = useMemo(
    () => countFilteredTalents(tags, flatFilters, hierarchicalFilters),
    [tags, flatFilters, hierarchicalFilters],
  );

  const getLevelValues = (facet: TFacetConfig) => {
    const maxLevels = facet.maxLevels ?? 2;
    const current = hierarchicalFilters[facet.key] ?? [];
    return Array.from({ length: maxLevels }, (_, index) => current[index] ?? null);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>Talent Tag Distribution</div>

      <div className={styles.summaryRow}>
        <Statistic title="Total tags" value={totalTags} />
        <Statistic title="Tagged talents" value={taggedTalents} />
      </div>

      <div className={styles.cardGrid}>
        {TALENT_TAG_FACETS.map((facet) => (
          <FacetCard key={facet.key} facet={facet} tags={tags} />
        ))}
      </div>

      <Card title="Filter detail" className={styles.detailCard}>
        <div className={styles.filterGrid}>
          {TALENT_TAG_FACETS.map((facet) => (
            <FacetFilterItem
              key={facet.key}
              facet={facet}
              tags={tags}
              flatValues={flatFilters[facet.key] ?? []}
              levelValues={getLevelValues(facet)}
              onFlatChange={(values) =>
                setFlatFilters((prev) => ({
                  ...prev,
                  [facet.key]: values,
                }))
              }
              onLevelChange={(levels) =>
                setHierarchicalFilters((prev) => ({
                  ...prev,
                  [facet.key]: levels,
                }))
              }
            />
          ))}
        </div>
        <Statistic
          title="Matching talents"
          value={filteredCount}
          valueStyle={{ fontSize: 32 }}
        />
      </Card>
    </div>
  );
};

export default TalentTagDistribution;
