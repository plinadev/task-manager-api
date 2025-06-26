import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationParams } from '../common/pagination.params';
import { PaginationResponse } from 'src/common/pagination.response';
import { CurrentUserId } from '../users/decorators/current-user-id.decorator';
import { Task } from './entities/task.entity';
import { FindTaskParams } from './params/find-task.params';
import { FindOneParams } from './params/find-one.params';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  public async findAll(
    @Query() filters: FindTaskParams,
    @Query() pagination: PaginationParams,
    @CurrentUserId() userId: string,
  ): Promise<PaginationResponse<Task>> {
    const [items, total] = await this.tasksService.findAll(
      filters,
      pagination,
      userId,
    );
    return {
      data: items,
      meta: {
        total,
        offset: pagination.offset,
        limit: pagination.limit,
      },
    };
  }

  @Get('/:id')
  public async findOne(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);

    this.checkTaskOwnership(task, userId);
    return task;
  }

  @Post()
  public async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    return await this.tasksService.createTask({
      ...createTaskDto,
      userId,
    });
  }

  @Patch('/:id')
  public async updateTask(
    @Param() params: FindOneParams,
    @Body() body: UpdateTaskDto,
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);

    try {
      return await this.tasksService.updateTask(task, body);
    } catch (err) {
      if (err instanceof WrongTaskStatusException) {
        throw new BadRequestException([err.message]);
      }
      throw err;
    }
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteTask(
    @Param() params: FindOneParams,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);

    await this.tasksService.deleteTask(task);
  }

  @Post('/:id/labels')
  public async addLabels(
    @Param() params: FindOneParams,
    @Body() labels: CreateTaskLabelDto[],
    @CurrentUserId() userId: string,
  ): Promise<Task> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);

    return await this.tasksService.addLabels(task, labels);
  }

  @Delete('/:id/labels')
  public async removeLabels(
    @Param() params: FindOneParams,
    @Body() labelsToRemove: string[],
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const task = await this.findOneOrFail(params.id);
    this.checkTaskOwnership(task, userId);
    await this.tasksService.removeLabels(task, labelsToRemove);
  }

  private async findOneOrFail(id: string): Promise<Task> {
    const task = await this.tasksService.findOne(id);
    if (!task) throw new NotFoundException();
    return task;
  }

  private checkTaskOwnership(task: Task, userId: string): void {
    if (task.userId !== userId)
      throw new ForbiddenException('You can only access your own tasks');
  }
}
