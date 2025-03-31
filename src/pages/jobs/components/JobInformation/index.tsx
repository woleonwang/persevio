import { useState } from "react";

interface IProps {
  jobId: number;
}

const JobInformation = (props: IProps) => {
  const { jobId } = props;

  const [job] = useState(jobId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-lg font-bold">{job}</div>
      </div>
    </div>
  );
};

export default JobInformation;
