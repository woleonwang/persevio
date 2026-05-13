import LocationIcon from "@/assets/icons/location-icon";
import Icon from "../../Icon";
import NoticeIcon from "@/assets/icons/notice";

type TSnapshotListRow = {
  title: string;
  subTitle?: string;
  tag?: string;
};

type TSnapshotListLayout = "timeline" | "stack";

function getDetailsString(details: string | string[]): string {
  if (Array.isArray(details)) {
    return details
      .map((d) => String(d).trim())
      .filter(Boolean)
      .join("\n");
  }
  return String(details ?? "").trim();
}

function toDetailLines(details: string | string[]): string[] {
  if (Array.isArray(details)) {
    return details.map((d) => String(d).trim()).filter(Boolean);
  }
  return getDetailsString(details)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isCareerTrajectorySnapshotTitle(title: string): boolean {
  return title.trim() === "Career Trajectory";
}

function isLocationTrajectorySnapshotTitle(title: string): boolean {
  return /^location\s+trajectory$/i.test(title.trim());
}

function isDomainExpertiseTitle(title: string): boolean {
  return /^domain expertise$/i.test(title.trim());
}

function isWorkEnvironmentsTitle(title: string): boolean {
  return /^work environments$/i.test(title.trim());
}

function isTenureTitle(title: string): boolean {
  return /^tenure$/i.test(title.trim());
}

function isCurrentLocationTitle(title: string): boolean {
  return /^current location$/i.test(title.trim());
}

function isNoticeTitle(title: string): boolean {
  return /^notice period$/i.test(title.trim());
}

/** Career Trajectory：`A (y)·B → C (y)·D` */
function parseCareerTrajectoryToRows(
  details: string | string[],
): TSnapshotListRow[] {
  const raw = getDetailsString(details);
  return raw
    .split(/\s*→\s*/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      let role: string;
      let years: string | undefined;
      const [roleWithYears, company] = d.split("·");
      const yearsStartIndex = roleWithYears.indexOf("(");
      const yearsEndIndex = roleWithYears.lastIndexOf(")");
      if (yearsStartIndex > -1 && yearsEndIndex > -1) {
        role = roleWithYears.slice(0, yearsStartIndex);
        years = roleWithYears.slice(yearsStartIndex + 1, yearsEndIndex);
      } else {
        role = roleWithYears;
      }
      const title = (company || role).trim();
      const subTitle = company ? role.trim() : undefined;
      const tag = years?.trim();
      return { title, subTitle, tag };
    });
}

/**
 * Location Trajectory：如 `Singapore (10 years), 2015–present`
 * 多条可用 `→`、`;` 或换行分隔。
 */
function parseLocationTrajectoryToRows(
  details: string | string[],
): TSnapshotListRow[] {
  const raw = getDetailsString(details);
  return raw
    .split(/\s*→\s*|\s*;\s*|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((segment) => {
      const m = segment.match(/^(.+?)\s*\(([^)]+)\)\s*(,\s*(.+))?$/);
      if (m) {
        return {
          title: m[1].trim(),
          tag: m[2].trim(),
          subTitle: m[4]?.trim(),
        };
      }
      return { title: segment };
    });
}

/** 行末 `(...)` 作为 tag，前面为 title（Domain / Work environments） */
function parseParenSuffixTagRows(
  details: string | string[],
): TSnapshotListRow[] {
  const lines = toDetailLines(details);
  return lines.map((line) => {
    const m = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (m) {
      return { title: m[1].trim(), tag: m[2].trim() };
    }
    return { title: line.trim() };
  });
}

/** `Average: ...` / `Longest: ...` */
function parseTenureLabelValueRows(
  details: string | string[],
): TSnapshotListRow[] {
  const lines = toDetailLines(details);
  return lines
    .map((line) => {
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (m) {
        return { title: m[2].trim(), subTitle: m[1].trim() };
      }
      return { title: line.trim() };
    })
    .filter((m) => m.subTitle !== "Gaps");
}

/**
 * Education：`Degree, University, 2016–2019` 或 `Degree, Uni, 2021`
 */
function parseSimpleListRows(details: string | string[]): TSnapshotListRow[] {
  const lines = toDetailLines(details);
  return lines.map((line) => {
    return { title: line.trim() };
  });
}

type TKeyInformationListRenderResult = {
  rows: TSnapshotListRow[];
  layout: TSnapshotListLayout;
  icon?: React.ReactNode;
};

export function getProfileSnapshotListRender(snap: {
  title: string;
  details: string | string[];
}): TKeyInformationListRenderResult | null {
  const title = snap.title;
  if (isCareerTrajectorySnapshotTitle(title)) {
    const rows = parseCareerTrajectoryToRows(snap.details);
    return rows.length ? { rows, layout: "timeline" } : null;
  }
  if (isLocationTrajectorySnapshotTitle(title)) {
    const rows = parseLocationTrajectoryToRows(snap.details);
    return rows.length ? { rows, layout: "timeline" } : null;
  }
  if (isDomainExpertiseTitle(title) || isWorkEnvironmentsTitle(title)) {
    const rows = parseParenSuffixTagRows(snap.details);
    return rows.length ? { rows, layout: "stack" } : null;
  }
  if (isTenureTitle(title)) {
    const rows = parseTenureLabelValueRows(snap.details);
    return rows.length ? { rows, layout: "stack" } : null;
  }

  const rows = parseSimpleListRows(snap.details);
  return rows.length ? { rows, layout: "stack" } : null;
}

export function getKeyInformationListRender(info: {
  title: string;
  details: string;
}): TKeyInformationListRenderResult | null {
  const rows = parseSimpleListRows(info.details);
  if (rows.length === 0) return null;

  const result: TKeyInformationListRenderResult = { rows, layout: "stack" };

  if (isCurrentLocationTitle(info.title)) {
    result.icon = <Icon icon={<LocationIcon />} />;
  }

  if (isNoticeTitle(info.title)) {
    result.icon = <Icon icon={<NoticeIcon />} />;
  }

  return result;
}

export const parseTotalYearsOfExperience = (
  text: string,
): {
  years: string;
  duration: string;
} => {
  const [years, duration] = text.split(",").map((s) => s.trim());
  return { years: years ?? "", duration: duration ?? "" };
};
