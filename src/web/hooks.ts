import * as React from "react";
import {DependencyList} from "react";

// https://kentcdodds.com/blog/dont-sync-state-derive-it
export const useComputedValue = <T>(compute: () => T, deps: DependencyList) => {
  const oldDepsRef = React.useRef<DependencyList>(deps);
  const computedValueRef = React.useRef<T>();

  if (oldDepsRef.current.length !== deps.length || oldDepsRef.current.some((dep, i) => dep !== deps[i])) computedValueRef.current = compute();

  oldDepsRef.current = deps;

  return computedValueRef.current;
};
