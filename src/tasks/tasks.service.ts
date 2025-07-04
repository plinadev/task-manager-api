import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './task.model';
import { WrongTaskStatusException } from './exceptions/wrong-task-status.exception';
import { CreateTaskLabelDto } from './dto/create-task-label.dto';
import { PaginationParams } from 'src/common/pagination.params';
import { Task } from './entities/task.entity';
import { TaskLabel } from './entities/task.label.entity';
import { FindTaskParams } from './params/find-task.params';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,

    @InjectRepository(TaskLabel)
    private readonly labelsRepository: Repository<TaskLabel>,
  ) {}

  public async findAll(
    filters: FindTaskParams,
    pagination: PaginationParams,
    userId: string,
  ): Promise<[Task[], number]> {
    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.labels', 'labels')
      .where('task.userId = :userId', { userId });
    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.search?.trim()) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.labels?.length) {
      const subQuery = query
        .subQuery()
        .select('labels.taskId')
        .from('task_label', 'labels')
        .where('labels.name IN (:...names)', { names: filters.labels })
        .getQuery();

      query.andWhere(`task.id IN ${subQuery}`);
    }

    query.orderBy(`task.${filters.sortBy}`, filters.sortOrder);

    query.skip(pagination.offset).take(pagination.limit);

    return query.getManyAndCount();
  }
  public async findOne(id: string): Promise<Task | null> {
    return await this.tasksRepository.findOne({
      where: { id },
      relations: ['labels'],
    });
  }

  public async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    if (createTaskDto.labels) {
      createTaskDto.labels = this.getUniqueLabels(createTaskDto.labels);
    }
    return await this.tasksRepository.save(createTaskDto);
  }

  public async updateTask(
    task: Task,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    if (
      updateTaskDto.status &&
      !this.isValidStatusTransition(task.status, updateTaskDto.status)
    ) {
      throw new WrongTaskStatusException();
    }

    if (updateTaskDto.labels) {
      updateTaskDto.labels = this.getUniqueLabels(updateTaskDto.labels);
    }

    Object.assign(task, updateTaskDto);
    return await this.tasksRepository.save(task);
  }

  public async deleteTask(task: Task): Promise<void> {
    await this.tasksRepository.delete(task.id);
  }

  public async removeLabels(
    task: Task,
    labelsToRemove: string[],
  ): Promise<void> {
    task.labels = task.labels.filter(
      (label) => !labelsToRemove.includes(label.name),
    );
    await this.tasksRepository.save(task);
  }
  public async addLabels(
    task: Task,
    labelDtos: CreateTaskLabelDto[],
  ): Promise<Task> {
    const existingNames = new Set(task.labels.map((label) => label.name));

    const labels = this.getUniqueLabels(labelDtos)
      .filter((dto) => !existingNames.has(dto.name))
      .map((label) => this.labelsRepository.create(label));

    if (labels.length) {
      task.labels = [...task.labels, ...labels];
      return await this.tasksRepository.save(task);
    }
    return task;
  }

  private isValidStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): boolean {
    const statusOrder = [
      TaskStatus.OPEN,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
    ];
    return statusOrder.indexOf(currentStatus) <= statusOrder.indexOf(newStatus);
  }

  private getUniqueLabels(
    labelDtos: CreateTaskLabelDto[],
  ): CreateTaskLabelDto[] {
    const uniqueNames = [...new Set(labelDtos.map((label) => label.name))];
    return uniqueNames.map((name) => ({ name }));
  }
}
