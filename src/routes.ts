import { EmployeeController } from "./controller/EmployeeController";

export const Routes = [
  {
    method: "get",
    route: "/employees",
    controller: EmployeeController,
    action: "all",
  },
  {
    method: "get",
    route: "/employees/:id",
    controller: EmployeeController,
    action: "one",
  },
  {
    method: "post",
    route: "/employees",
    controller: EmployeeController,
    action: "save",
  },
  {
    method: "delete",
    route: "/employees/:id",
    controller: EmployeeController,
    action: "remove",
  },
];
