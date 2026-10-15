import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PersonService } from "../../application/services/person.service";
import { RequirePermission } from "../../../../common/decorators/permissions.decorator";
import { createPersonRequestSchema, updatePersonRequestSchema } from "@sgc/contracts";

@ApiTags("Properties - Persons")
@ApiBearerAuth()
@Controller("v1/persons")
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @RequirePermission("properties:person.list")
  @ApiOperation({ summary: "List persons in tenant" })
  @ApiResponse({ status: 200, description: "List of persons" })
  async list(@Query("search") search?: string) {
    return this.personService.listPersons(search);
  }

  @Get(":id")
  @RequirePermission("properties:person.list")
  @ApiOperation({ summary: "Get person by ID" })
  async getOne(@Param("id") id: string) {
    return this.personService.getPerson(id);
  }

  @Post()
  @RequirePermission("properties:person.create")
  @ApiOperation({ summary: "Create person" })
  @ApiResponse({ status: 201, description: "Person created" })
  async create(@Body() body: any) {
    const validated = createPersonRequestSchema.parse(body);
    return this.personService.createPerson(validated);
  }

  @Patch(":id")
  @RequirePermission("properties:person.update")
  @ApiOperation({ summary: "Update person" })
  async update(@Param("id") id: string, @Body() body: any) {
    const validated = updatePersonRequestSchema.parse(body);
    return this.personService.updatePerson(id, validated);
  }
}
